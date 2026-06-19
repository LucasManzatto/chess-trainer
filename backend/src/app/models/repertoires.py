from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .openings import Base


class RepertoireCard(Base):
    __tablename__ = "repertoire_cards"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=func.gen_random_uuid())
    user_id: Mapped[str] = mapped_column(Text)
    position_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("positions.id", ondelete="CASCADE"))
    side: Mapped[str] = mapped_column(Text)
    user_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    ease: Mapped[float] = mapped_column(Float, default=2.5)
    interval_days: Mapped[float] = mapped_column(Float, default=1.0)
    due: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reps: Mapped[int] = mapped_column(Integer, default=0)
    lapses: Mapped[int] = mapped_column(Integer, default=0)
    state: Mapped[str] = mapped_column(Text, default="new")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
