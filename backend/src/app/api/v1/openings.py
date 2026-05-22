from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth import get_current_user_id
from ...db import get_session
from ...schemas.openings import (
    DrillAddResponse,
    DrillQueueItem,
    OpeningCommentCreate,
    OpeningCommentResponse,
    OpeningCommentUpdate,
    PositionCommentCreate,
    PositionCommentResponse,
    PositionCommentUpdate,
    ReviewRequest,
)
from ...services import comments
from ...services import drill as drill_service

router = APIRouter(prefix="/openings", tags=["openings"])

Session = Annotated[AsyncSession, Depends(get_session)]
UserId = Annotated[str, Depends(get_current_user_id)]


# ---------------------------------------------------------------------------
# Opening comments
# ---------------------------------------------------------------------------


@router.get("/{opening_id}/comments", response_model=list[OpeningCommentResponse])
async def list_opening_comments(
    opening_id: int, session: Session, user_id: UserId
) -> list[OpeningCommentResponse]:
    return await comments.list_opening_comments(session, user_id, opening_id)


@router.post(
    "/{opening_id}/comments",
    response_model=OpeningCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_opening_comment(
    opening_id: int, body: OpeningCommentCreate, session: Session, user_id: UserId
) -> OpeningCommentResponse:
    return await comments.create_opening_comment(session, user_id, opening_id, body.content)


@router.put("/comments/{comment_id}", response_model=OpeningCommentResponse)
async def update_opening_comment(
    comment_id: int, body: OpeningCommentUpdate, session: Session, user_id: UserId
) -> OpeningCommentResponse:
    return await comments.update_opening_comment(session, user_id, comment_id, body.content)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_opening_comment(comment_id: int, session: Session, user_id: UserId) -> None:
    return await comments.delete_opening_comment(session, user_id, comment_id)


# ---------------------------------------------------------------------------
# Position comments
# ---------------------------------------------------------------------------


@router.get("/{opening_id}/position-comments", response_model=list[PositionCommentResponse])
async def list_position_comments(
    opening_id: int, session: Session, user_id: UserId
) -> list[PositionCommentResponse]:
    return await comments.list_position_comments(session, user_id, opening_id)


@router.post(
    "/{opening_id}/position-comments",
    response_model=PositionCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_position_comment(
    opening_id: int, body: PositionCommentCreate, session: Session, user_id: UserId
) -> PositionCommentResponse:
    return await comments.create_position_comment(
        session, user_id, opening_id, body.move_index, body.fen, body.content
    )


@router.put("/position-comments/{comment_id}", response_model=PositionCommentResponse)
async def update_position_comment(
    comment_id: int, body: PositionCommentUpdate, session: Session, user_id: UserId
) -> PositionCommentResponse:
    return await comments.update_position_comment(session, user_id, comment_id, body.content)


@router.delete("/position-comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position_comment(comment_id: int, session: Session, user_id: UserId) -> None:
    return await comments.delete_position_comment(session, user_id, comment_id)


# ---------------------------------------------------------------------------
# Drill (SRS)
# ---------------------------------------------------------------------------


@router.get("/drill/queue", response_model=list[DrillQueueItem])
async def get_drill_queue(session: Session, user_id: UserId) -> list[DrillQueueItem]:
    return await drill_service.get_queue(session, user_id)


@router.post(
    "/{opening_id}/drill",
    response_model=DrillAddResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_to_drill(opening_id: int, session: Session, user_id: UserId) -> DrillAddResponse:
    return await drill_service.add_to_drill(session, user_id, opening_id)


@router.post("/{opening_id}/review", response_model=DrillAddResponse)
async def review_opening(
    opening_id: int, body: ReviewRequest, session: Session, user_id: UserId
) -> DrillAddResponse:
    return await drill_service.review(session, user_id, opening_id, body.grade)
