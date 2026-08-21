from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class Opening(Base):
    __tablename__ = "openings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    eco: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    pgn: Mapped[str] = mapped_column(Text, nullable=False)
    uci: Mapped[str] = mapped_column(Text, nullable=False)
    epd: Mapped[str] = mapped_column(Text, unique=True, nullable=False)


class Position(Base):
    __tablename__ = "positions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=func.gen_random_uuid())
    fen: Mapped[str] = mapped_column(Text, nullable=False)
    position_key: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(Text, nullable=True)
    moves: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PositionAnnotationComment(Base):
    __tablename__ = "position_annotations_comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    position_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("positions.id", ondelete="CASCADE")
    )
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PositionAnnotationArrow(Base):
    __tablename__ = "position_annotations_arrows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    position_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("positions.id", ondelete="CASCADE")
    )
    from_square: Mapped[str] = mapped_column("from", Text)
    to_square: Mapped[str] = mapped_column("to", Text)
    color: Mapped[str] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(Text, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    line_style: Mapped[str] = mapped_column(Text, server_default="solid")
    # Step number in a multi-move plan (e.g. arrows 1, 2, 3 depicting a sequence) — null
    # means unordered.
    order: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Groups arrows into one chained plan (e.g. Nf6 -> Bg4 -> e3 -> Nc6), ordered by
    # `order`. Not a FK — just a shared tag, scoped implicitly to the position.
    line_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)


class PositionAnnotationCircle(Base):
    __tablename__ = "position_annotations_circles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    position_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("positions.id", ondelete="CASCADE")
    )
    square: Mapped[str] = mapped_column(Text)
    color: Mapped[str] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(Text, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    line_style: Mapped[str] = mapped_column(Text, server_default="solid")
    # Filled square wash instead of a ring — marks a concept (weak square, outpost) on
    # the square itself.
    fill: Mapped[bool] = mapped_column(Boolean, server_default="false")
