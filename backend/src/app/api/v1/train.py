from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth import get_current_user_id
from ...db import get_session
from ...schemas.train import CardCreate, CardDelete, CardResponse, CardReview, CoverageResponse, StatsResponse
from ...services import train as train_service

router = APIRouter(prefix="/train", tags=["train"])

Session = Annotated[AsyncSession, Depends(get_session)]
UserId = Annotated[str, Depends(get_current_user_id)]


@router.get("/cards", response_model=list[CardResponse])
async def list_cards(
    session: Session,
    user_id: UserId,
    side: Annotated[str | None, Query(pattern="^(white|black)$")] = None,
) -> list[CardResponse]:
    return await train_service.list_cards(session, user_id, side)


@router.post("/cards", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
async def commit_move(
    body: CardCreate,
    session: Session,
    user_id: UserId,
) -> CardResponse:
    return await train_service.commit_move(session, user_id, body)


@router.delete("/cards", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(
    body: CardDelete,
    session: Session,
    user_id: UserId,
) -> None:
    await train_service.delete_card(session, user_id, body.position_key)


@router.get("/cards/due", response_model=list[CardResponse])
async def get_due_cards(
    session: Session,
    user_id: UserId,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list[CardResponse]:
    return await train_service.get_due_cards(session, user_id, limit)


@router.post("/cards/review", response_model=CardResponse)
async def review_card(
    body: CardReview,
    session: Session,
    user_id: UserId,
) -> CardResponse:
    return await train_service.review_card(session, user_id, body.position_key, body.grade)


@router.post("/cards/reset", status_code=status.HTTP_204_NO_CONTENT)
async def reset_cards(session: Session, user_id: UserId) -> None:
    await train_service.reset_cards(session, user_id)


@router.get("/coverage", response_model=CoverageResponse)
async def get_coverage(session: Session, user_id: UserId) -> CoverageResponse:
    return await train_service.get_coverage(session, user_id)


@router.get("/stats", response_model=StatsResponse)
async def get_stats(session: Session, user_id: UserId) -> StatsResponse:
    return await train_service.get_stats(session, user_id)
