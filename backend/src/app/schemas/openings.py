from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PositionCreate(BaseModel):
    fen: str
    name: str | None = None
    moves: list[str] = []


class PositionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    fen: str
    name: str | None
    moves: list[str]
    created_at: datetime


class PositionMoveCreate(BaseModel):
    from_fen: str
    to_fen: str
    san: str
    lan: str
    is_main_line: bool = False
    commentary: str | None = None


class PositionMoveUpdate(BaseModel):
    is_main_line: bool | None = None
    commentary: str | None = None


class PositionMoveResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    from_position_id: str
    to_position_id: str
    san: str
    lan: str
    is_main_line: bool
    commentary: str | None


class PositionCommentCreate(BaseModel):
    content: str


class PositionCommentUpdate(BaseModel):
    content: str


class PositionCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    position_id: str
    content: str
    created_at: datetime


class PositionAnnotationArrowCreate(BaseModel):
    from_square: str
    to_square: str
    color: str


class PositionAnnotationArrowUpdate(BaseModel):
    color: str


class PositionAnnotationArrowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fen: str
    from_square: str
    to_square: str
    color: str


class PositionAnnotationCircleCreate(BaseModel):
    square: str
    color: str


class PositionAnnotationCircleUpdate(BaseModel):
    color: str


class PositionAnnotationCircleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fen: str
    square: str
    color: str


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
