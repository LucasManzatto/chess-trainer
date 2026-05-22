from datetime import UTC, date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.openings import Opening, OpeningProgress
from ..schemas.openings import DrillAddResponse, DrillQueueItem


def compute_sm2(
    ease_factor: float,
    interval_days: int,
    repetitions: int,
    grade: int,
) -> tuple[float, int, int]:
    """Pure SM-2 algorithm. Returns (new_ease_factor, new_interval_days, new_repetitions)."""
    if grade < 3:
        return ease_factor, 1, 0

    if repetitions == 0:
        new_interval = 1
    elif repetitions == 1:
        new_interval = 6
    else:
        new_interval = round(interval_days * ease_factor)

    new_ef = max(1.3, ease_factor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    return new_ef, new_interval, repetitions + 1


async def get_queue(
    session: AsyncSession,
    user_id: str,
) -> list[DrillQueueItem]:
    result = await session.execute(
        select(
            Opening.id.label("opening_id"),
            Opening.eco,
            Opening.name,
            Opening.pgn,
            Opening.fen,
            Opening.moves,
            OpeningProgress.ease_factor,
            OpeningProgress.interval_days,
            OpeningProgress.due_date,
            OpeningProgress.repetitions,
        )
        .select_from(OpeningProgress)
        .join(Opening, Opening.id == OpeningProgress.opening_id)
        .where(OpeningProgress.user_id == user_id, OpeningProgress.due_date <= date.today())
        .order_by(OpeningProgress.due_date.asc())
    )
    return [DrillQueueItem(**dict(row)) for row in result.mappings()]


async def add_to_drill(
    session: AsyncSession,
    user_id: str,
    opening_id: int,
) -> DrillAddResponse:
    ins = pg_insert(OpeningProgress).values(user_id=user_id, opening_id=opening_id)
    stmt = ins.on_conflict_do_update(
        index_elements=["user_id", "opening_id"],
        set_={"opening_id": ins.excluded.opening_id},
    ).returning(OpeningProgress.opening_id, OpeningProgress.due_date)
    result = await session.execute(stmt)
    row = result.one()
    await session.commit()
    return DrillAddResponse(opening_id=row.opening_id, due_date=row.due_date)


async def review(
    session: AsyncSession,
    user_id: str,
    opening_id: int,
    grade: int,
) -> DrillAddResponse:
    result = await session.execute(
        select(OpeningProgress).where(
            OpeningProgress.user_id == user_id,
            OpeningProgress.opening_id == opening_id,
        )
    )
    progress = result.scalar_one_or_none()
    if progress is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Opening not in drill queue"
        )

    new_ef, new_interval, new_reps = compute_sm2(
        ease_factor=progress.ease_factor,
        interval_days=progress.interval_days,
        repetitions=progress.repetitions,
        grade=grade,
    )

    progress.ease_factor = new_ef
    progress.interval_days = new_interval
    progress.repetitions = new_reps
    progress.due_date = date.today() + timedelta(days=new_interval)
    progress.last_reviewed = datetime.now(UTC)

    await session.commit()
    return DrillAddResponse(opening_id=opening_id, due_date=progress.due_date)
