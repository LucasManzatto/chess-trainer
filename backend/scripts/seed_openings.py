#!/usr/bin/env python3
"""
Seed the `openings` table from lichess-org/chess-openings dataset (dist method).

Clones the repo, builds dist/all.tsv via its own `bin/gen.py` (the same
build lichess CI publishes — validated, transposition-deduped, adds
`uci`/`epd` columns), then upserts into `openings` keyed on `epd`.

`openings.epd` joins loosely to `positions.position_key` (no FK: not every
opening has been reached in a tracked game/repertoire, and vice versa).

Usage:
    DATABASE_URL=postgresql://... python backend/scripts/seed_openings.py
"""

import asyncio
import csv
import io
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import asyncpg
import chess
import chess.pgn

REPO_URL = "https://github.com/lichess-org/chess-openings"
SOURCE_FILES = ["a.tsv", "b.tsv", "c.tsv", "d.tsv", "e.tsv"]

FRONTEND_PUBLIC = Path(__file__).parent.parent.parent / "frontend" / "public"


def pgn_to_fen_and_moves(pgn_str: str) -> tuple[str, list[str]] | None:
    """Return (final_fen, [san_moves]) for a PGN move string, or None on failure."""
    try:
        game = chess.pgn.read_game(io.StringIO(f"[Result \"*\"]\n\n{pgn_str} *"))
        if game is None:
            return None
        board = game.board()
        moves: list[str] = []
        for move in game.mainline_moves():
            moves.append(board.san(move))
            board.push(move)
        return board.fen(), moves
    except Exception:
        return None


def build_dist(repo_dir: Path) -> Path:
    """Clone chess-openings and build dist/all.tsv via its own gen.py."""
    print(f"Cloning {REPO_URL}...")
    subprocess.run(
        ["git", "clone", "--depth", "1", REPO_URL, str(repo_dir)],
        check=True,
        capture_output=True,
    )

    dist_dir = repo_dir / "dist"
    dist_dir.mkdir(exist_ok=True)
    all_tsv = dist_dir / "all.tsv"

    print("Building dist/all.tsv via bin/gen.py...")
    with all_tsv.open("w") as out:
        subprocess.run(
            [sys.executable, "bin/gen.py", *SOURCE_FILES],
            cwd=repo_dir,
            check=True,
            stdout=out,
        )
    return all_tsv


async def main() -> None:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set", file=sys.stderr)
        sys.exit(1)

    with tempfile.TemporaryDirectory() as tmp:
        all_tsv = build_dist(Path(tmp) / "chess-openings")

        print(f"Reading {all_tsv}...")
        rows = list(csv.DictReader(all_tsv.open(), delimiter="\t"))
        print(f"Total: {len(rows)} openings.")

        openings: list[dict] = []
        positions: list[dict] = []
        skipped = 0
        for row in rows:
            eco = row.get("eco", "").strip()
            name = row.get("name", "").strip()
            pgn = row.get("pgn", "").strip()
            uci = row.get("uci", "").strip()
            epd = row.get("epd", "").strip()
            if not (eco and name and pgn and epd):
                skipped += 1
                continue
            openings.append({"eco": eco, "name": name, "pgn": pgn, "uci": uci, "epd": epd})

            result = pgn_to_fen_and_moves(pgn)
            if result is None:
                print(f"  WARN: could not parse PGN for '{name}' ({pgn})", file=sys.stderr)
                continue
            fen, moves = result
            positions.append({"fen": fen, "position_key": epd, "name": name, "moves": moves})

    print(f"Parsed {len(openings)} openings ({skipped} skipped).")

    print("Connecting to database...")
    conn = await asyncpg.connect(database_url)
    try:
        print("Upserting openings...")
        await conn.executemany(
            """
            INSERT INTO openings (eco, name, pgn, uci, epd)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (epd) DO UPDATE SET eco = EXCLUDED.eco, name = EXCLUDED.name,
                pgn = EXCLUDED.pgn, uci = EXCLUDED.uci
            """,
            [(o["eco"], o["name"], o["pgn"], o["uci"], o["epd"]) for o in openings],
        )
        print(f"Upserted {len(openings)} rows.")
    finally:
        await conn.close()

    print("Writing frontend/public/positions.json...")
    FRONTEND_PUBLIC.mkdir(parents=True, exist_ok=True)
    out_path = FRONTEND_PUBLIC / "positions.json"
    out_path.write_text(json.dumps(positions, ensure_ascii=False))
    print(f"Wrote {out_path} ({out_path.stat().st_size // 1024} KB).")
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
