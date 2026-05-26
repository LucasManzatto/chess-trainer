from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

MoveClassification = Literal['best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder']


class MoveAnalysis(BaseModel):
    san: str
    cp_loss: int
    best_move: str
    classification: MoveClassification
    score: float | None = None


class GameAnalysisCreate(BaseModel):
    moves: list[MoveAnalysis]
    white_accuracy: float
    black_accuracy: float
    depth: int
    analyzed_at: datetime
    initial_score: float | None = None


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    chess_com_username: str | None
    sync_status: str
    sync_progress: dict | None
    last_sync_at: datetime | None


class UserProfileUpdate(BaseModel):
    chess_com_username: str = Field(min_length=1)


class GameResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    chess_com_id: str
    white_username: str
    white_rating: int | None
    black_username: str
    black_rating: int | None
    user_color: str
    result: str
    termination: str | None
    time_class: str | None
    time_control: str | None
    eco: str | None
    opening_name: str | None
    moves: list[str]
    pgn: str
    played_at: datetime | None
    analysis: dict | None = None


class GamesListResponse(BaseModel):
    items: list[GameResponse]
    total: int


class SyncStatusResponse(BaseModel):
    status: str
    current_month: int | None
    total_months: int | None
    games_added: int | None
    last_sync_at: datetime | None
