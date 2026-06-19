from typing import TypedDict

import chess


class DrillFields(TypedDict):
    fen: str
    line: list[str]
    answer: str


def compute_drill_fields(moves: list[str]) -> DrillFields:
    """Compute drill FEN, replay line, and answer UCI from a full position move sequence."""
    board = chess.Board()
    for san in moves[:-1]:
        board.push_san(san)
    drill_fen = board.fen()
    answer_move = board.parse_san(moves[-1])
    return DrillFields(
        fen=drill_fen,
        line=moves[:-1],
        answer=answer_move.uci(),
    )


def compute_sm2(
    ease_factor: float,
    interval_days: int,
    repetitions: int,
    grade: int,
) -> tuple[float, int, int]:
    """Pure SM-2 algorithm. Returns (new_ease_factor, new_interval_days, new_repetitions)."""
    if grade < 3:
        return ease_factor, 1, 0

    if repetitions == 0:
        new_interval = 1
    elif repetitions == 1:
        new_interval = 6
    else:
        new_interval = round(interval_days * ease_factor)

    new_ef = max(1.3, ease_factor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    return new_ef, new_interval, repetitions + 1
