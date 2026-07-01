from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth import get_current_user_id
from ...db import get_session
from ...schemas.openings import (
    PositionAnnotationCommentCreate,
    PositionAnnotationCommentResponse,
    PositionAnnotationCommentUpdate,
    PositionAnnotationsReplace,
    PositionAnnotationsResponse,
    PositionCreate,
    PositionDetailResponse,
    PositionResponse,
)
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
# Position comments (fixed /comments prefix before /{fen:path} routes)
# ---------------------------------------------------------------------------


@router.put("/comments/{comment_id}", response_model=PositionAnnotationCommentResponse)
async def update_position_comment(
    comment_id: int, body: PositionAnnotationCommentUpdate, session: Session, user_id: UserId
) -> PositionAnnotationCommentResponse:
    return await positions_service.update_position_comment(session, comment_id, body.content)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position_comment(comment_id: int, session: Session, user_id: UserId) -> None:
    await positions_service.delete_position_comment(session, comment_id)


# ---------------------------------------------------------------------------
# /{fen:path} catch-alls — MUST be last; greedy path param swallows everything
# ---------------------------------------------------------------------------


@router.get("/{fen:path}/comments", response_model=list[PositionAnnotationCommentResponse])
async def list_position_comments(
    fen: str, session: Session, user_id: UserId
) -> list[PositionAnnotationCommentResponse]:
    return await positions_service.list_position_comments(session, fen)


@router.post(
    "/{fen:path}/comments",
    response_model=PositionAnnotationCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_position_comment(
    fen: str, body: PositionAnnotationCommentCreate, session: Session, user_id: UserId
) -> PositionAnnotationCommentResponse:
    return await positions_service.create_position_comment(session, fen, body)


@router.put("/{fen:path}/annotations", response_model=PositionAnnotationsResponse)
async def replace_position_annotations(
    fen: str, body: PositionAnnotationsReplace, session: Session, user_id: UserId
) -> PositionAnnotationsResponse:
    return await positions_service.replace_position_annotations(session, fen, body)


@router.get("/{fen:path}/detail", response_model=PositionDetailResponse)
async def get_position_detail(
    fen: str, session: Session, user_id: UserId
) -> PositionDetailResponse:
    return await positions_service.get_position_detail(session, fen)


@router.get("/{fen:path}", response_model=PositionResponse)
async def get_position(fen: str, session: Session, user_id: UserId) -> PositionResponse:
    return await positions_service.get_position(session, fen)


@router.delete("/{fen:path}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position(fen: str, session: Session, user_id: UserId) -> None:
    await positions_service.delete_position(session, fen)
