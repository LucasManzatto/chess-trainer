from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth import get_current_user_id
from ...db import get_session
from ...schemas.openings import (
    MoveStatsResponse,
    PositionAnnotationArrowCreate,
    PositionAnnotationArrowResponse,
    PositionAnnotationArrowUpdate,
    PositionAnnotationCircleCreate,
    PositionAnnotationCircleResponse,
    PositionAnnotationCircleUpdate,
    PositionCommentCreate,
    PositionCommentResponse,
    PositionCommentUpdate,
    PositionCreate,
    PositionMoveCreate,
    PositionMoveResponse,
    PositionMoveUpdate,
    PositionResponse,
)
from ...services import move_stats as move_stats_service
from ...services import positions as positions_service

router = APIRouter(prefix="/positions", tags=["positions"])

Session = Annotated[AsyncSession, Depends(get_session)]
UserId = Annotated[str, Depends(get_current_user_id)]


# ---------------------------------------------------------------------------
# Positions (fixed paths first, then /{fen:path} catch-alls last)
# ---------------------------------------------------------------------------


@router.post("", response_model=PositionResponse)
async def upsert_position(
    body: PositionCreate, session: Session, user_id: UserId
) -> PositionResponse:
    return await positions_service.upsert_position(session, body)


# ---------------------------------------------------------------------------
# Position moves (fixed /moves prefix before /{fen:path} routes)
# ---------------------------------------------------------------------------


@router.post("/moves", response_model=PositionMoveResponse, status_code=status.HTTP_201_CREATED)
async def create_position_move(
    body: PositionMoveCreate, session: Session, user_id: UserId
) -> PositionMoveResponse:
    return await positions_service.create_position_move(session, body)


@router.put("/moves/{move_id}", response_model=PositionMoveResponse)
async def update_position_move(
    move_id: str, body: PositionMoveUpdate, session: Session, user_id: UserId
) -> PositionMoveResponse:
    return await positions_service.update_position_move(session, move_id, body)


@router.delete("/moves/{move_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position_move(move_id: str, session: Session, user_id: UserId) -> None:
    await positions_service.delete_position_move(session, move_id)


# ---------------------------------------------------------------------------
# Position comments (fixed /comments prefix before /{fen:path} routes)
# ---------------------------------------------------------------------------


@router.put("/comments/{comment_id}", response_model=PositionCommentResponse)
async def update_position_comment(
    comment_id: int, body: PositionCommentUpdate, session: Session, user_id: UserId
) -> PositionCommentResponse:
    return await positions_service.update_position_comment(
        session, user_id, comment_id, body.content
    )


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position_comment(comment_id: int, session: Session, user_id: UserId) -> None:
    await positions_service.delete_position_comment(session, user_id, comment_id)


# ---------------------------------------------------------------------------
# Annotation arrows (fixed /annotations/arrows prefix before /{fen:path} routes)
# ---------------------------------------------------------------------------


@router.put("/annotations/arrows/{arrow_id}", response_model=PositionAnnotationArrowResponse)
async def update_position_annotation_arrow(
    arrow_id: int, body: PositionAnnotationArrowUpdate, session: Session, user_id: UserId
) -> PositionAnnotationArrowResponse:
    return await positions_service.update_position_annotation_arrow(session, arrow_id, body)


@router.delete("/annotations/arrows/{arrow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position_annotation_arrow(
    arrow_id: int, session: Session, user_id: UserId
) -> None:
    await positions_service.delete_position_annotation_arrow(session, arrow_id)


# ---------------------------------------------------------------------------
# Annotation circles (fixed /annotations/circles prefix before /{fen:path} routes)
# ---------------------------------------------------------------------------


@router.put("/annotations/circles/{circle_id}", response_model=PositionAnnotationCircleResponse)
async def update_position_annotation_circle(
    circle_id: int, body: PositionAnnotationCircleUpdate, session: Session, user_id: UserId
) -> PositionAnnotationCircleResponse:
    return await positions_service.update_position_annotation_circle(session, circle_id, body)


@router.delete("/annotations/circles/{circle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position_annotation_circle(
    circle_id: int, session: Session, user_id: UserId
) -> None:
    await positions_service.delete_position_annotation_circle(session, circle_id)


# ---------------------------------------------------------------------------
# Move statistics (Lichess Opening Explorer)
# ---------------------------------------------------------------------------


@router.get("/move-stats", response_model=MoveStatsResponse)
async def get_move_stats(
    request: Request,
    session: Session,
    user_id: UserId,
    moves: Annotated[
        str, Query(description="Comma-separated SAN moves, empty for starting position")
    ] = "",
) -> MoveStatsResponse:
    http_client: httpx.AsyncClient = request.app.state.http_client
    moves_list = [m for m in moves.split(",") if m]
    return await move_stats_service.get_move_stats(session, http_client, moves_list)


# ---------------------------------------------------------------------------
# /{fen:path} catch-alls — MUST be last; greedy path param swallows everything
# ---------------------------------------------------------------------------


@router.get("/{fen:path}/moves", response_model=list[PositionMoveResponse])
async def list_position_moves(
    fen: str, session: Session, user_id: UserId
) -> list[PositionMoveResponse]:
    return await positions_service.list_position_moves(session, fen)


@router.get("/{fen:path}/comments", response_model=list[PositionCommentResponse])
async def list_position_comments(
    fen: str, session: Session, user_id: UserId
) -> list[PositionCommentResponse]:
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


@router.get("/{fen:path}/annotations/arrows", response_model=list[PositionAnnotationArrowResponse])
async def list_position_annotation_arrows(
    fen: str, session: Session, user_id: UserId
) -> list[PositionAnnotationArrowResponse]:
    return await positions_service.list_position_annotation_arrows(session, fen)


@router.post(
    "/{fen:path}/annotations/arrows",
    response_model=PositionAnnotationArrowResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_position_annotation_arrow(
    fen: str, body: PositionAnnotationArrowCreate, session: Session, user_id: UserId
) -> PositionAnnotationArrowResponse:
    return await positions_service.create_position_annotation_arrow(session, fen, body)


@router.get(
    "/{fen:path}/annotations/circles", response_model=list[PositionAnnotationCircleResponse]
)
async def list_position_annotation_circles(
    fen: str, session: Session, user_id: UserId
) -> list[PositionAnnotationCircleResponse]:
    return await positions_service.list_position_annotation_circles(session, fen)


@router.post(
    "/{fen:path}/annotations/circles",
    response_model=PositionAnnotationCircleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_position_annotation_circle(
    fen: str, body: PositionAnnotationCircleCreate, session: Session, user_id: UserId
) -> PositionAnnotationCircleResponse:
    return await positions_service.create_position_annotation_circle(session, fen, body)


@router.get("/{fen:path}", response_model=PositionResponse)
async def get_position(fen: str, session: Session, user_id: UserId) -> PositionResponse:
    return await positions_service.get_position(session, fen)


@router.delete("/{fen:path}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position(fen: str, session: Session, user_id: UserId) -> None:
    await positions_service.delete_position(session, fen)
