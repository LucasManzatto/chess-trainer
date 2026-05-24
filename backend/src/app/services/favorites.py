from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.openings import OpeningFavorite
from ..schemas.openings import FavoriteResponse


async def list_favorites(session: AsyncSession, user_id: str) -> list[int]:
    result = await session.execute(
        select(OpeningFavorite.opening_id).where(OpeningFavorite.user_id == user_id)
    )
    return list(result.scalars())


async def toggle_favorite(
    session: AsyncSession, user_id: str, opening_id: int
) -> FavoriteResponse:
    result = await session.execute(
        select(OpeningFavorite).where(
            OpeningFavorite.user_id == user_id,
            OpeningFavorite.opening_id == opening_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        await session.execute(
            delete(OpeningFavorite).where(
                OpeningFavorite.user_id == user_id,
                OpeningFavorite.opening_id == opening_id,
            )
        )
        await session.commit()
        return FavoriteResponse(opening_id=opening_id, is_favorite=False)

    session.add(OpeningFavorite(user_id=user_id, opening_id=opening_id))
    await session.commit()
    return FavoriteResponse(opening_id=opening_id, is_favorite=True)
