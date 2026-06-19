#!/usr/bin/env python3
"""
Seed positions from lichess-org/chess-openings dataset.

Usage:
    DATABASE_URL=postgresql://... python backend/scripts/seed_openings.py

Outputs:
    - Upserts all openings into the `positions` table
    - Writes frontend/public/positions.json
"""

import asyncio
import csv
import io
import json
import os
import sys
from pathlib import Path

import asyncpg
import chess
import chess.pgn
import httpx

TSV_BASE = "https://raw.githubusercontent.com/lichess-org/chess-openings/master"
ECO_FILES = ["a", "b", "c", "d", "e"]

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


async def fetch_tsv(client: httpx.AsyncClient, letter: str) -> list[dict]:
    url = f"{TSV_BASE}/{letter}.tsv"
    resp = await client.get(url, timeout=30.0)
    resp.raise_for_status()
    reader = csv.DictReader(io.StringIO(resp.text), delimiter="\t")
    return list(reader)


async def main() -> None:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set", file=sys.stderr)
        sys.exit(1)

    print("Fetching TSV files from lichess-org/chess-openings...")
    async with httpx.AsyncClient() as client:
        all_rows: list[dict] = []
        for letter in ECO_FILES:
            rows = await fetch_tsv(client, letter)
            all_rows.extend(rows)
            print(f"  {letter}.tsv: {len(rows)} openings")

    print(f"Total: {len(all_rows)} openings. Computing FENs...")

    positions: list[dict] = []
    skipped = 0
    for row in all_rows:
        eco = row.get("eco", "").strip()
        name = row.get("name", "").strip()
        pgn = row.get("pgn", "").strip()
        if not (eco and name and pgn):
            skipped += 1
            continue
        result = pgn_to_fen_and_moves(pgn)
        if result is None:
            print(f"  WARN: could not parse PGN for '{name}' ({pgn})", file=sys.stderr)
            skipped += 1
            continue
        fen, moves = result
        positions.append({"fen": fen, "name": name, "moves": moves})

    print(f"Parsed {len(positions)} positions ({skipped} skipped).")

    print("Connecting to database...")
    conn = await asyncpg.connect(database_url)
    try:
        print("Upserting positions...")
        await conn.executemany(
            """
            INSERT INTO positions (fen, name, moves)
            VALUES ($1, $2, $3)
            ON CONFLICT (fen) DO UPDATE SET name = EXCLUDED.name, moves = EXCLUDED.moves
            """,
            [(p["fen"], p["name"], p["moves"]) for p in positions],
        )
        print(f"Upserted {len(positions)} rows.")
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
