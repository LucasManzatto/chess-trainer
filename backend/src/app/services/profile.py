from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.games import UserProfile


async def get_or_create_profile(session: AsyncSession, user_id: str) -> UserProfile:
    result = await session.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = UserProfile(user_id=user_id)
        session.add(profile)
        await session.commit()
        await session.refresh(profile)
    return profile


async def get_profile(session: AsyncSession, user_id: str) -> UserProfile:
    return await get_or_create_profile(session, user_id)


async def update_profile(session: AsyncSession, user_id: str, chess_com_username: str) -> UserProfile:
    profile = await get_or_create_profile(session, user_id)
    profile.chess_com_username = chess_com_username
    await session.commit()
    await session.refresh(profile)
    return profile
