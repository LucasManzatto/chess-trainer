#!/usr/bin/env python3
"""
Seed openings from lichess-org/chess-openings dataset.

Usage:
    DATABASE_URL=postgresql://... python backend/scripts/seed_openings.py

Outputs:
    - Inserts all openings into the `openings` table
    - Writes frontend/public/openings.json
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


async def run_migration(conn: asyncpg.Connection) -> None:
    migrations_dir = Path(__file__).parent.parent / "migrations"
    sql = (migrations_dir / "001_openings.sql").read_text()
    await conn.execute(sql)


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

    openings: list[dict] = []
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
        openings.append({"eco": eco, "name": name, "pgn": pgn, "fen": fen, "moves": moves})

    print(f"Parsed {len(openings)} openings ({skipped} skipped).")

    print("Connecting to database...")
    conn = await asyncpg.connect(database_url)
    try:
        print("Running migration...")
        await run_migration(conn)

        print("Inserting openings (UPSERT by eco+name)...")
        await conn.execute("TRUNCATE openings RESTART IDENTITY CASCADE")
        await conn.executemany(
            """
            INSERT INTO openings (eco, name, pgn, fen, moves)
            VALUES ($1, $2, $3, $4, $5)
            """,
            [(o["eco"], o["name"], o["pgn"], o["fen"], o["moves"]) for o in openings],
        )

        # Fetch back with DB-assigned IDs
        rows = await conn.fetch("SELECT id, eco, name, pgn, fen, moves FROM openings ORDER BY id")
        db_openings = [
            {"id": r["id"], "eco": r["eco"], "name": r["name"], "pgn": r["pgn"], "fen": r["fen"], "moves": list(r["moves"])}
            for r in rows
        ]
        print(f"Inserted {len(db_openings)} rows.")
    finally:
        await conn.close()

    print("Writing frontend/public/openings.json...")
    FRONTEND_PUBLIC.mkdir(parents=True, exist_ok=True)
    out_path = FRONTEND_PUBLIC / "openings.json"
    out_path.write_text(json.dumps(db_openings, ensure_ascii=False))
    print(f"Wrote {out_path} ({out_path.stat().st_size // 1024} KB).")
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
