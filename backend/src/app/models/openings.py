from datetime import date, datetime
from typing import Any

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class Opening(Base):
    __tablename__ = "openings"

    id: Mapped[int] = mapped_column(primary_key=True)
    eco: Mapped[str] = mapped_column(String(3))
    name: Mapped[str] = mapped_column(Text)
    pgn: Mapped[str] = mapped_column(Text)
    fen: Mapped[str] = mapped_column(Text)
    moves: Mapped[list[str]] = mapped_column(ARRAY(Text))


class OpeningComment(Base):
    __tablename__ = "opening_comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(Text)
    opening_id: Mapped[int] = mapped_column(Integer, ForeignKey("openings.id"))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PositionComment(Base):
    __tablename__ = "position_comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(Text)
    opening_id: Mapped[int] = mapped_column(Integer, ForeignKey("openings.id"))
    move_index: Mapped[int] = mapped_column(Integer)
    fen: Mapped[str] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class OpeningFavorite(Base):
    __tablename__ = "opening_favorites"

    user_id: Mapped[str] = mapped_column(Text, primary_key=True)
    opening_id: Mapped[int] = mapped_column(Integer, ForeignKey("openings.id"), primary_key=True)


class OpeningProgress(Base):
    __tablename__ = "opening_progress"

    user_id: Mapped[str] = mapped_column(Text, primary_key=True)
    opening_id: Mapped[int] = mapped_column(Integer, ForeignKey("openings.id"), primary_key=True)
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5)
    interval_days: Mapped[int] = mapped_column(Integer, default=1)
    due_date: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    repetitions: Mapped[int] = mapped_column(Integer, default=0)
    last_reviewed: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PositionMoveStats(Base):
    __tablename__ = "position_move_stats"

    moves: Mapped[list[str]] = mapped_column(ARRAY(Text), primary_key=True)
    stats: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
