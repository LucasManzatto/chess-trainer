from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth import get_current_user_id
from ...db import get_session
from ...schemas.openings import OpeningResponse
from ...services import openings as openings_service

router = APIRouter(prefix="/openings", tags=["openings"])

Session = Annotated[AsyncSession, Depends(get_session)]
UserId = Annotated[str, Depends(get_current_user_id)]


@router.get("/{fen:path}", response_model=OpeningResponse)
async def get_opening(fen: str, session: Session, user_id: UserId) -> OpeningResponse:
    return await openings_service.get_opening_by_fen(session, fen)
