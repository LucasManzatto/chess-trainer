from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CardCreate(BaseModel):
    position_key: str
    fen: str
    side: Literal["white", "black"]
    answer: str
    line: list[str] = []
    opening_eco: str | None = None
    opening_name: str | None = None
    plan: str | None = None


class CardReview(BaseModel):
    position_key: str
    grade: int = Field(ge=0, le=5)


class CardDelete(BaseModel):
    position_key: str


class CardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    position_key: str
    fen: str
    side: str
    answer: str
    line: list[str]
    opening_eco: str | None
    opening_name: str | None
    plan: str | None
    ease: float
    interval_days: float
    due: datetime
    reps: int
    lapses: int
    state: str


class CoverageResponse(BaseModel):
    white: int
    black: int
    total: int
