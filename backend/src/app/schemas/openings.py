from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PositionCreate(BaseModel):
    fen: str
    eco: str | None = None
    name: str | None = None
    pgn: str | None = None
    moves: list[str] = []


class PositionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    fen: str
    eco: str | None
    name: str | None
    pgn: str | None
    moves: list[str]


class UserPositionSave(BaseModel):
    fen: str


class PositionCommentCreate(BaseModel):
    content: str


class PositionCommentUpdate(BaseModel):
    content: str


class PositionCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    fen: str
    content: str
    created_at: datetime


class MoveStat(BaseModel):
    san: str
    uci: str
    white: int
    draws: int
    black: int
    total: int
    percentage: float


class MoveStatsResponse(BaseModel):
    moves: list[MoveStat]
    total_games: int
