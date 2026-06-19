from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class CardCreate(BaseModel):
    fen: str
    moves: list[str]
    side: Literal["white", "black"]
    name: str | None = None
    user_plan: str | None = None


class CardReview(BaseModel):
    position_id: str
    grade: int = Field(ge=0, le=5)


class CardDelete(BaseModel):
    position_id: str


class CardResponse(BaseModel):
    id: str
    position_id: str
    side: str
    user_plan: str | None
    ease: float
    interval_days: float
    due: datetime
    reps: int
    lapses: int
    state: str
    # Computed from positions.moves on serve — not stored in DB
    fen: str
    line: list[str]
    answer: str
    name: str | None


class CoverageResponse(BaseModel):
    white: int
    black: int
    total: int


class StatsResponse(BaseModel):
    total: int
    due: int
    new: int
    learning: int
    review: int
    relearning: int
