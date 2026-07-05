import math
from datetime import UTC, datetime

import chess
import chess.engine
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..models.games import Game
from ..schemas.games import GameAnalysisCreate, MoveAnalysis, MoveClassification


def classify_move(cp_loss: int) -> MoveClassification:
    if cp_loss == 0:
        return "best"
    if cp_loss <= 10:
        return "excellent"
    if cp_loss <= 25:
        return "good"
    if cp_loss <= 50:
        return "inaccuracy"
    if cp_loss <= 100:
        return "mistake"
    return "blunder"


def cp_to_win_percent(cp: float) -> float:
    return 50 + 50 * math.tanh(cp / 600)


def compute_accuracy(win_percent_losses: list[float]) -> float:
    if not win_percent_losses:
        return 100.0
    avg = sum(win_percent_losses) / len(win_percent_losses)
    raw = 103.1668 * math.exp(-0.04354 * avg) - 3.1669
    return max(0.0, min(100.0, raw))


def _build_boards(moves: list[str]) -> list[chess.Board]:
    """One Board snapshot per position: starting position plus one per ply."""
    board = chess.Board()
    boards = [board.copy()]
    for san in moves:
        board.push_san(san)
        boards.append(board.copy())
    return boards


async def run_analysis(
    game_id: int,
    moves: list[str],
    depth: int,
    session: AsyncSession,
) -> None:
    result = await session.execute(select(Game).where(Game.id == game_id))
    game = result.scalar_one()

    boards = _build_boards(moves)
    total = len(boards)
    game.analyze_status = "running"
    game.analyze_progress = {"current": 0, "total": total}
    await session.commit()

    try:
        _, engine = await chess.engine.popen_uci(settings.stockfish_path)
        try:
            scores: list[float] = []
            best_moves: list[str] = []

            for i, board in enumerate(boards):
                info = await engine.analyse(board, chess.engine.Limit(depth=depth))
                score = info["score"].white().score(mate_score=30000)
                pv = info.get("pv")
                best_moves.append(pv[0].uci() if pv else "")
                scores.append(float(score) if score is not None else 0.0)

                game.analyze_progress = {"current": i + 1, "total": total}
                await session.commit()
        finally:
            await engine.quit()

        move_count = len(scores) - 1
        moves_analysis: list[MoveAnalysis] = []
        white_win_losses: list[float] = []
        black_win_losses: list[float] = []

        for i in range(move_count):
            before = scores[i]
            after = scores[i + 1]
            is_white_move = i % 2 == 0
            cp_loss = (
                max(0, round(before - after)) if is_white_move else max(0, round(after - before))
            )

            win_loss = (
                max(0.0, cp_to_win_percent(before) - cp_to_win_percent(after))
                if is_white_move
                else max(0.0, cp_to_win_percent(after) - cp_to_win_percent(before))
            )

            moves_analysis.append(
                MoveAnalysis(
                    san=moves[i] if i < len(moves) else "",
                    cp_loss=cp_loss,
                    best_move=best_moves[i],
                    classification=classify_move(cp_loss),
                    score=scores[i + 1],
                )
            )

            if is_white_move:
                white_win_losses.append(win_loss)
            else:
                black_win_losses.append(win_loss)

        analysis = GameAnalysisCreate(
            moves=moves_analysis,
            white_accuracy=compute_accuracy(white_win_losses),
            black_accuracy=compute_accuracy(black_win_losses),
            depth=depth,
            analyzed_at=datetime.now(UTC),
            initial_score=scores[0] if scores else None,
        )

        game.analysis = analysis.model_dump(mode="json")
        game.analyze_status = "done"
        game.analyze_progress = {"current": total, "total": total}
        await session.commit()

    except Exception:
        game.analyze_status = "error"
        await session.commit()
        raise
