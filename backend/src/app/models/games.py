from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .openings import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[str] = mapped_column(Text, primary_key=True)
    chess_com_username: Mapped[str | None] = mapped_column(Text, nullable=True)
    sync_status: Mapped[str] = mapped_column(String(16), default="idle")
    sync_progress: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Game(Base):
    __tablename__ = "games"
    __table_args__ = (UniqueConstraint("user_id", "chess_com_id", name="uq_games_user_chess_com"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(Text, index=True)
    chess_com_id: Mapped[str] = mapped_column(Text)
    white_username: Mapped[str] = mapped_column(Text)
    white_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    black_username: Mapped[str] = mapped_column(Text)
    black_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_color: Mapped[str] = mapped_column(String(8))  # "white" | "black"
    result: Mapped[str] = mapped_column(String(8))       # "win" | "loss" | "draw"
    termination: Mapped[str | None] = mapped_column(Text, nullable=True)
    time_class: Mapped[str | None] = mapped_column(String(16), nullable=True)
    time_control: Mapped[str | None] = mapped_column(Text, nullable=True)
    eco: Mapped[str | None] = mapped_column(String(4), nullable=True)
    opening_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    moves: Mapped[list[str]] = mapped_column(ARRAY(Text))
    pgn: Mapped[str] = mapped_column(Text)
    played_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)


class SyncedMonth(Base):
    __tablename__ = "synced_months"

    user_id: Mapped[str] = mapped_column(Text, primary_key=True)
    year: Mapped[int] = mapped_column(Integer, primary_key=True)
    month: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_count: Mapped[int] = mapped_column(Integer, default=0)
    synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
