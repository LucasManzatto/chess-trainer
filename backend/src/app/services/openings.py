from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import NotFoundError
from ..models.openings import Opening
from ..schemas.openings import OpeningResponse
from ..utils.chess import position_key


async def get_opening_by_fen(session: AsyncSession, fen: str) -> OpeningResponse:
    result = await session.execute(select(Opening).where(Opening.epd == position_key(fen)))
    opening = result.scalar_one_or_none()
    if opening is None:
        raise NotFoundError("Opening not found")
    return OpeningResponse.model_validate(opening)
