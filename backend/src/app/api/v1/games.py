from typing import Annotated

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth import get_current_user_id
from ...db import get_session
from ...schemas.games import GamesListResponse, SyncStatusResponse
from ...services import games as games_service

router = APIRouter(prefix="/games", tags=["games"])

Session = Annotated[AsyncSession, Depends(get_session)]
UserId = Annotated[str, Depends(get_current_user_id)]


@router.post("/sync", status_code=status.HTTP_202_ACCEPTED)
async def trigger_sync(
    request: Request,
    background_tasks: BackgroundTasks,
    session: Session,
    user_id: UserId,
) -> dict[str, str]:
    http_client: httpx.AsyncClient = request.app.state.http_client
    return await games_service.trigger_sync(session, user_id, background_tasks, http_client)


@router.get("/sync/status", response_model=SyncStatusResponse)
async def get_sync_status(session: Session, user_id: UserId) -> SyncStatusResponse:
    return await games_service.get_sync_status(session, user_id)


@router.get("", response_model=GamesListResponse)
async def list_games(
    session: Session,
    user_id: UserId,
    result: str | None = Query(default=None),
    color: str | None = Query(default=None),
    time_class: str | None = Query(default=None),
    eco: str | None = Query(default=None),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
) -> GamesListResponse:
    return await games_service.list_games(session, user_id, result, color, time_class, eco, limit, offset)
