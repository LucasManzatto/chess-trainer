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


class PositionAnnotationCommentCreate(BaseModel):
    content: str


class PositionAnnotationCommentUpdate(BaseModel):
    content: str


class PositionAnnotationCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fen: str
    content: str
    created_at: datetime


class PositionAnnotationArrowInput(BaseModel):
    from_square: str
    to_square: str
    color: str


class PositionAnnotationArrowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fen: str
    from_square: str
    to_square: str
    color: str


class PositionAnnotationCircleInput(BaseModel):
    square: str
    color: str


class PositionAnnotationCircleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fen: str
    square: str
    color: str


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
