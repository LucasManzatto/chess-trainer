from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class Position(Base):
    __tablename__ = "positions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=func.gen_random_uuid())
    fen: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(Text, nullable=True)
    moves: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PositionComment(Base):
    __tablename__ = "position_comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(Text)
    position_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("positions.id", ondelete="CASCADE"))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())



class PositionMove(Base):
    __tablename__ = "position_moves"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=func.gen_random_uuid())
    from_position_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("positions.id", ondelete="CASCADE"))
    to_position_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("positions.id", ondelete="CASCADE"))
    san: Mapped[str] = mapped_column(Text)
    lan: Mapped[str] = mapped_column(Text)
    is_main_line: Mapped[bool] = mapped_column(Boolean, default=False)
    commentary: Mapped[str | None] = mapped_column(Text, nullable=True)


class PositionAnnotationArrow(Base):
    __tablename__ = "position_annotations_arrows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fen: Mapped[str] = mapped_column(Text, ForeignKey("positions.fen", ondelete="CASCADE"))
    from_square: Mapped[str] = mapped_column("from", Text)
    to_square: Mapped[str] = mapped_column("to", Text)
    color: Mapped[str] = mapped_column(Text)


class PositionAnnotationCircle(Base):
    __tablename__ = "position_annotations_circles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fen: Mapped[str] = mapped_column(Text, ForeignKey("positions.fen", ondelete="CASCADE"))
    square: Mapped[str] = mapped_column(Text)
    color: Mapped[str] = mapped_column(Text)


class PositionMoveStats(Base):
    __tablename__ = "position_move_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    moves: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, unique=True)
    stats: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
