from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

AnnotationCategory = Literal["best_move", "attacker", "defender", "target", "threat", "idea"]
AnnotationLineStyle = Literal["solid", "dashed", "dotted"]


class PositionCreate(BaseModel):
    fen: str
    name: str | None = None
    moves: list[str] = []


class OpeningResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    eco: str
    name: str
    pgn: str
    uci: str
    epd: str


class OpeningLookupRequest(BaseModel):
    fens: list[str]


class OpeningLookupResponse(BaseModel):
    opening: OpeningResponse
    is_exact: bool


class OpeningBranchesRequest(BaseModel):
    uci_moves: list[str] = []


class OpeningBranchResponse(BaseModel):
    eco: str
    name: str
    first_move: str
    continuation: str


class PositionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    fen: str
    name: str | None
    moves: list[str]
    created_at: datetime


class PositionAnnotationCommentCreate(BaseModel):
    content: str


class PositionAnnotationCommentUpdate(BaseModel):
    content: str


class PositionAnnotationCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    position_id: str
    content: str
    created_at: datetime


class PositionAnnotationArrowInput(BaseModel):
    from_square: str
    to_square: str
    color: str
    category: AnnotationCategory | None = None
    comment: str | None = None
    line_style: AnnotationLineStyle = "solid"
    order: int | None = None


class PositionAnnotationArrowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    position_id: str
    from_square: str
    to_square: str
    color: str
    category: AnnotationCategory | None
    comment: str | None
    line_style: AnnotationLineStyle
    order: int | None


class PositionAnnotationCircleInput(BaseModel):
    square: str
    color: str
    category: AnnotationCategory | None = None
    comment: str | None = None
    line_style: AnnotationLineStyle = "solid"
    fill: bool = False


class PositionAnnotationCircleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    position_id: str
    square: str
    color: str
    category: AnnotationCategory | None
    comment: str | None
    line_style: AnnotationLineStyle
    fill: bool


class PositionAnnotationsReplace(BaseModel):
    arrows: list[PositionAnnotationArrowInput] = []
    circles: list[PositionAnnotationCircleInput] = []


class PositionAnnotationsResponse(BaseModel):
    arrows: list[PositionAnnotationArrowResponse]
    circles: list[PositionAnnotationCircleResponse]


class PositionDetailResponse(BaseModel):
    position: PositionResponse | None
    comments: list[PositionAnnotationCommentResponse]
    arrows: list[PositionAnnotationArrowResponse]
    circles: list[PositionAnnotationCircleResponse]
