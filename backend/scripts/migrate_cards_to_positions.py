#!/usr/bin/env python3
"""
Pre-migration script for 010_uuid_pk_normalize.

For each repertoire_card, computes the new positions.fen (FEN after the answer
move) and positions.moves (full line including answer SAN), upserts that
position into the CURRENT schema (fen as PK), and records the mapping
card_id → position_fen in a temp table.

Migration 010 then joins this mapping against positions(fen) to fill
repertoire_cards.position_id once UUIDs have been assigned.

Run this BEFORE applying 010_uuid_pk_normalize.sql.

Usage:
    DATABASE_URL=postgresql://... python backend/scripts/migrate_cards_to_positions.py
"""

import asyncio
import os
import sys

import asyncpg
import chess


async def main() -> None:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not set", file=sys.stderr)
        sys.exit(1)

    conn = await asyncpg.connect(database_url)
    try:
        cards = await conn.fetch(
            "SELECT id, fen, answer, line, opening_name FROM repertoire_cards"
        )
        print(f"Found {len(cards)} cards to migrate.")

        await conn.execute("DROP TABLE IF EXISTS card_position_mapping")
        await conn.execute("""
            CREATE TABLE card_position_mapping (
                card_id UUID NOT NULL,
                position_fen TEXT NOT NULL
            )
        """)

        errors = 0
        for card in cards:
            try:
                board = chess.Board(card["fen"])
                move = chess.Move.from_uci(card["answer"])
                san = board.san(move)
                board.push(move)
                new_fen = board.fen()
                new_moves = list(card["line"]) + [san]
                name = card["opening_name"]
            except Exception as e:
                print(f"  WARN: card {card['id']} error: {e}", file=sys.stderr)
                errors += 1
                continue

            await conn.execute(
                """
                INSERT INTO positions (fen, name, moves)
                VALUES ($1, $2, $3)
                ON CONFLICT (fen) DO UPDATE
                    SET name = COALESCE(EXCLUDED.name, positions.name),
                        moves = EXCLUDED.moves
                """,
                new_fen,
                name,
                new_moves,
            )

            await conn.execute(
                "INSERT INTO card_position_mapping (card_id, position_fen) VALUES ($1, $2)",
                card["id"],
                new_fen,
            )

        mapped = await conn.fetchval("SELECT COUNT(*) FROM card_position_mapping")
        print(f"Mapped {mapped}/{len(cards)} cards. Errors: {errors}.")
        if errors:
            print("Fix errors before running SQL migration.", file=sys.stderr)
            sys.exit(1)
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
