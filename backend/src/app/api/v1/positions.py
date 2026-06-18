from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth import get_current_user_id
from ...db import get_session
from ...schemas.openings import (
    MoveStatsResponse,
    PositionCommentCreate,
    PositionCommentResponse,
    PositionCommentUpdate,
    PositionCreate,
    PositionResponse,
    UserPositionSave,
)
from ...services import move_stats as move_stats_service
from ...services import positions as positions_service

router = APIRouter(prefix="/positions", tags=["positions"])

Session = Annotated[AsyncSession, Depends(get_session)]
UserId = Annotated[str, Depends(get_current_user_id)]


# ---------------------------------------------------------------------------
# Positions
# ---------------------------------------------------------------------------


@router.post("", response_model=PositionResponse)
async def upsert_position(body: PositionCreate, session: Session, user_id: UserId) -> PositionResponse:
    return await positions_service.upsert_position(session, body)


# ---------------------------------------------------------------------------
# User positions (My Openings)
# ---------------------------------------------------------------------------


@router.get("/mine", response_model=list[PositionResponse])
async def list_user_positions(session: Session, user_id: UserId) -> list[PositionResponse]:
    return await positions_service.list_user_positions(session, user_id)


@router.post("/mine", response_model=PositionResponse, status_code=status.HTTP_201_CREATED)
async def save_user_position(body: UserPositionSave, session: Session, user_id: UserId) -> PositionResponse:
    return await positions_service.save_user_position(session, user_id, body.fen)


@router.delete("/mine/{fen:path}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_position(fen: str, session: Session, user_id: UserId) -> None:
    await positions_service.remove_user_position(session, user_id, fen)


# ---------------------------------------------------------------------------
# Position comments
# ---------------------------------------------------------------------------


@router.get("/{fen:path}/comments", response_model=list[PositionCommentResponse])
async def list_position_comments(fen: str, session: Session, user_id: UserId) -> list[PositionCommentResponse]:
    return await positions_service.list_position_comments(session, user_id, fen)


@router.post(
    "/{fen:path}/comments",
    response_model=PositionCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_position_comment(
    fen: str, body: PositionCommentCreate, session: Session, user_id: UserId
) -> PositionCommentResponse:
    return await positions_service.create_position_comment(session, user_id, fen, body)


@router.put("/comments/{comment_id}", response_model=PositionCommentResponse)
async def update_position_comment(
    comment_id: int, body: PositionCommentUpdate, session: Session, user_id: UserId
) -> PositionCommentResponse:
    return await positions_service.update_position_comment(session, user_id, comment_id, body.content)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position_comment(comment_id: int, session: Session, user_id: UserId) -> None:
    await positions_service.delete_position_comment(session, user_id, comment_id)


# ---------------------------------------------------------------------------
# Move statistics (Lichess Opening Explorer)
# ---------------------------------------------------------------------------


@router.get("/move-stats", response_model=MoveStatsResponse)
async def get_move_stats(
    request: Request,
    session: Session,
    user_id: UserId,
    moves: Annotated[str, Query(description="Comma-separated SAN moves, empty for starting position")] = "",
) -> MoveStatsResponse:
    http_client: httpx.AsyncClient = request.app.state.http_client
    moves_list = [m for m in moves.split(",") if m]
    return await move_stats_service.get_move_stats(session, http_client, moves_list)
