import asyncpg
from fastapi import HTTPException, status

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
    conn: asyncpg.Connection,
    user_id: str,
) -> list[DrillQueueItem]:
    rows = await conn.fetch(
        """
        SELECT o.id AS opening_id, o.eco, o.name, o.pgn, o.fen, o.moves,
               p.ease_factor, p.interval_days, p.due_date, p.repetitions
        FROM opening_progress p
        JOIN openings o ON o.id = p.opening_id
        WHERE p.user_id = $1 AND p.due_date <= CURRENT_DATE
        ORDER BY p.due_date ASC
        """,
        user_id,
    )
    return [DrillQueueItem(**dict(r)) for r in rows]


async def add_to_drill(
    conn: asyncpg.Connection,
    user_id: str,
    opening_id: int,
) -> DrillAddResponse:
    row = await conn.fetchrow(
        """
        INSERT INTO opening_progress (user_id, opening_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, opening_id) DO UPDATE SET opening_id = EXCLUDED.opening_id
        RETURNING opening_id, due_date
        """,
        user_id,
        opening_id,
    )
    return DrillAddResponse(**dict(row))


async def review(
    conn: asyncpg.Connection,
    user_id: str,
    opening_id: int,
    grade: int,
) -> DrillAddResponse:
    row = await conn.fetchrow(
        "SELECT ease_factor, interval_days, repetitions"
        " FROM opening_progress WHERE user_id = $1 AND opening_id = $2",
        user_id,
        opening_id,
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Opening not in drill queue"
        )

    new_ef, new_interval, new_reps = compute_sm2(
        ease_factor=row["ease_factor"],
        interval_days=row["interval_days"],
        repetitions=row["repetitions"],
        grade=grade,
    )

    result = await conn.fetchrow(
        """
        UPDATE opening_progress
        SET ease_factor = $1, interval_days = $2, repetitions = $3,
            due_date = CURRENT_DATE + $2, last_reviewed = NOW()
        WHERE user_id = $4 AND opening_id = $5
        RETURNING opening_id, due_date
        """,
        new_ef,
        new_interval,
        new_reps,
        user_id,
        opening_id,
    )
    return DrillAddResponse(**dict(result))
