from typing import Annotated

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth import get_current_user_id
from ...db import get_session
from ...schemas.games import (
    AnalyzeStatusResponse,
    GameAnalysisCreate,
    GameResponse,
    GameReviewedUpdate,
    GamesListResponse,
    SyncStatusResponse,
)
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
    eco: str | None = Query(default=None),
    has_critical_moves: bool | None = Query(default=None),
    reviewed: bool | None = Query(default=None),
    first_critical_move: int | None = Query(default=None, ge=1),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
) -> GamesListResponse:
    return await games_service.list_games(
        session, user_id, result, color, eco,
        has_critical_moves, reviewed, first_critical_move, limit, offset,
    )


@router.put("/{game_id}/analysis", response_model=GameResponse)
async def save_game_analysis(
    game_id: int,
    analysis: GameAnalysisCreate,
    session: Session,
    user_id: UserId,
) -> GameResponse:
    return await games_service.save_game_analysis(session, game_id, user_id, analysis)


@router.put("/{game_id}/reviewed", response_model=GameResponse)
async def set_game_reviewed(
    game_id: int,
    update: GameReviewedUpdate,
    session: Session,
    user_id: UserId,
) -> GameResponse:
    return await games_service.set_game_reviewed(session, game_id, user_id, update)


@router.post("/{game_id}/analyze", status_code=status.HTTP_202_ACCEPTED)
async def trigger_analyze(
    game_id: int,
    background_tasks: BackgroundTasks,
    session: Session,
    user_id: UserId,
    depth: int = Query(default=18),
) -> dict[str, str]:
    return await games_service.trigger_analyze(session, game_id, user_id, depth, background_tasks)


@router.get("/{game_id}/analyze/status", response_model=AnalyzeStatusResponse)
async def get_analyze_status(
    game_id: int, session: Session, user_id: UserId,
) -> AnalyzeStatusResponse:
    return await games_service.get_analyze_status(session, game_id, user_id)
