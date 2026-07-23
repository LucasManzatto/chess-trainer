from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import NotFoundError
from ..models.openings import Opening
from ..schemas.openings import OpeningLookupResponse, OpeningResponse
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
