#!/usr/bin/env python3
"""
Analyse every game missing engine analysis, and backfill critical_moves for
games that were analysed before that column existed.

Usage:
    DATABASE_URL=postgresql://... python backend/scripts/analyze_all_games.py [--depth 18] \\
        [--dry-run]
"""

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from sqlalchemy import select  # noqa: E402

from app.db import get_session, init_db, teardown_db  # noqa: E402
from app.models.games import Game  # noqa: E402
from app.schemas.games import MoveAnalysis  # noqa: E402
from app.services.games_analysis import find_critical_moves, run_analysis  # noqa: E402


async def backfill_critical_moves(game_id: int) -> None:
    async for session in get_session():
        result = await session.execute(select(Game).where(Game.id == game_id))
        game = result.scalar_one()
        assert game.analysis is not None

        moves = [MoveAnalysis(**m) for m in game.analysis["moves"]]
        initial_score = game.analysis.get("initial_score") or 0.0
        game.critical_moves = find_critical_moves(moves, initial_score, game.user_color)
        await session.commit()


async def analyze_game(game_id: int, moves: list[str], depth: int) -> None:
    async for session in get_session():
        await run_analysis(game_id, moves, depth, session)


async def main(depth: int, dry_run: bool) -> None:
    await init_db()
    try:
        async for session in get_session():
            result = await session.execute(
                select(Game.id, Game.moves, Game.analysis, Game.critical_moves)
            )
            rows = result.all()

        to_analyze = [r for r in rows if r.analysis is None]
        to_backfill = [r for r in rows if r.analysis is not None and r.critical_moves is None]

        print(f"{len(to_analyze)} games need full analysis.")
        print(f"{len(to_backfill)} games need critical-moves backfill.")
        if dry_run:
            return

        for i, row in enumerate(to_analyze, 1):
            print(f"[{i}/{len(to_analyze)}] analyzing game {row.id}...")
            try:
                await analyze_game(row.id, row.moves, depth)
            except Exception as e:
                print(f"  ERROR analyzing game {row.id}: {e}", file=sys.stderr)

        for i, row in enumerate(to_backfill, 1):
            print(f"[{i}/{len(to_backfill)}] backfilling critical moves for game {row.id}...")
            try:
                await backfill_critical_moves(row.id)
            except Exception as e:
                print(f"  ERROR backfilling game {row.id}: {e}", file=sys.stderr)
    finally:
        await teardown_db()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--depth", type=int, default=18, help="Stockfish search depth")
    parser.add_argument("--dry-run", action="store_true", help="Only print counts, don't analyze")
    args = parser.parse_args()
    asyncio.run(main(args.depth, args.dry_run))
