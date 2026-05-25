from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth import get_current_user_id
from ...db import get_session
from ...models.games import UserProfile
from ...schemas.games import UserProfileResponse, UserProfileUpdate
from ...services import profile as profile_service

router = APIRouter(prefix="/users", tags=["users"])

Session = Annotated[AsyncSession, Depends(get_session)]
UserId = Annotated[str, Depends(get_current_user_id)]


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(session: Session, user_id: UserId) -> UserProfile:
    return await profile_service.get_profile(session, user_id)


@router.patch("/profile", response_model=UserProfileResponse)
async def update_profile(body: UserProfileUpdate, session: Session, user_id: UserId) -> UserProfile:
    return await profile_service.update_profile(session, user_id, body.chess_com_username)
