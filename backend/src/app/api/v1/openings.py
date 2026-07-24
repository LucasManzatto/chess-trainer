from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth import get_current_user_id
from ...db import get_session
from ...schemas.openings import (
    OpeningBranchesRequest,
    OpeningBranchResponse,
    OpeningLookupRequest,
    OpeningLookupResponse,
    OpeningResponse,
)
from ...services import openings as openings_service

router = APIRouter(prefix="/openings", tags=["openings"])

Session = Annotated[AsyncSession, Depends(get_session)]
UserId = Annotated[str, Depends(get_current_user_id)]


@router.post("/lookup", response_model=OpeningLookupResponse)
async def lookup_nearest_opening(
    body: OpeningLookupRequest, session: Session, user_id: UserId
) -> OpeningLookupResponse:
    return await openings_service.get_nearest_opening(session, body.fens)


@router.post("/branches", response_model=list[OpeningBranchResponse])
async def get_opening_branches(
    body: OpeningBranchesRequest, session: Session, user_id: UserId
) -> list[OpeningBranchResponse]:
    return await openings_service.get_opening_branches(session, body.uci_moves)


@router.get("/{fen:path}", response_model=OpeningResponse)
async def get_opening(fen: str, session: Session, user_id: UserId) -> OpeningResponse:
    return await openings_service.get_opening_by_fen(session, fen)
