import chess
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import NotFoundError
from ..models.openings import Opening
from ..schemas.openings import OpeningBranchResponse, OpeningLookupResponse, OpeningResponse
from ..utils.chess import position_key


async def get_opening_by_fen(session: AsyncSession, fen: str) -> OpeningResponse:
    result = await session.execute(select(Opening).where(Opening.epd == position_key(fen)))
    opening = result.scalar_one_or_none()
    if opening is None:
        raise NotFoundError("Opening not found")
    return OpeningResponse.model_validate(opening)


async def get_nearest_opening(session: AsyncSession, fens: list[str]) -> OpeningLookupResponse:
    """Return the opening for the first `fens` entry that has one.

    `fens` is ordered nearest-ancestor-first (current position, then parent,
    grandparent, ...) so a game that has left book still resolves to the last
    known opening along its move path. `is_exact` tells the caller whether
    the match was on `fens[0]` (the current position) or an ancestor.
    """
    keys = [position_key(fen) for fen in fens]
    result = await session.execute(select(Opening).where(Opening.epd.in_(keys)))
    by_epd = {o.epd: o for o in result.scalars()}
    for i, key in enumerate(keys):
        if key in by_epd:
            return OpeningLookupResponse(
                opening=OpeningResponse.model_validate(by_epd[key]), is_exact=i == 0
            )
    raise NotFoundError("Opening not found")


def _format_continuation(board: chess.Board, uci_moves: list[str]) -> str:
    """Render `uci_moves` as SAN starting from `board`, e.g. '3. exd5 cxd5 4. Ne5'."""
    board = board.copy()
    parts = []
    for uci in uci_moves:
        move = chess.Move.from_uci(uci)
        if board.turn == chess.WHITE:
            parts.append(f"{board.fullmove_number}.")
        elif not parts:
            parts.append(f"{board.fullmove_number}...")
        parts.append(board.san(move))
        board.push(move)
    return " ".join(parts)


async def get_opening_branches(
    session: AsyncSession, uci_moves: list[str]
) -> list[OpeningBranchResponse]:
    """Named openings that diverge from the current position on a later move.

    Matches openings whose recorded move order starts with `uci_moves` and
    continues further (transpositions via a different move order won't match).
    """
    if not uci_moves:
        return []

    escaped = " ".join(uci_moves).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    pattern = f"{escaped} %"
    result = await session.execute(
        select(Opening)
        .where(Opening.uci.like(pattern, escape="\\"))
        .order_by(Opening.uci)
    )

    board = chess.Board()
    for uci in uci_moves:
        board.push_uci(uci)

    by_first_move: dict[str, list[OpeningBranchResponse]] = {}
    for opening in result.scalars():
        remaining = opening.uci.split(" ")[len(uci_moves) :]
        first_move = board.san(chess.Move.from_uci(remaining[0]))
        by_first_move.setdefault(first_move, []).append(
            OpeningBranchResponse(
                eco=opening.eco,
                name=opening.name,
                first_move=first_move,
                continuation=_format_continuation(board, remaining),
            )
        )

    ordered_groups = sorted(by_first_move.values(), key=len, reverse=True)
    return [branch for group in ordered_groups for branch in group]
