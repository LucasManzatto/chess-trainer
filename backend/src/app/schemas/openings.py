from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class OpeningCommentCreate(BaseModel):
    content: str


class OpeningCommentUpdate(BaseModel):
    content: str


class OpeningCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    opening_id: int
    content: str
    created_at: datetime


class PositionCommentCreate(BaseModel):
    move_index: int
    fen: str
    content: str


class PositionCommentUpdate(BaseModel):
    content: str


class PositionCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    opening_id: int
    move_index: int
    fen: str
    content: str
    created_at: datetime


class DrillQueueItem(BaseModel):
    opening_id: int
    eco: str
    name: str
    pgn: str
    fen: str
    moves: list[str]
    ease_factor: float
    interval_days: int
    due_date: date
    repetitions: int


class ReviewRequest(BaseModel):
    grade: int = Field(ge=0, le=5)


class DrillAddResponse(BaseModel):
    opening_id: int
    due_date: date
