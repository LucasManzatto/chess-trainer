from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import NotFoundError
from ..models.openings import RepertoireCard
from ..schemas.train import CardCreate, CardResponse, CoverageResponse
from .drill import compute_sm2

_LEARNING_RELEARN_INTERVAL = 1.0


def _next_state(current: str, grade: int) -> str:
    if current in ("new", "learning"):
        return "review" if grade >= 3 else "learning"
    if current == "review":
        return "review" if grade >= 3 else "relearning"
    # relearning
    return "review" if grade >= 3 else "relearning"


async def list_cards(
    session: AsyncSession,
    user_id: str,
    side: str | None = None,
) -> list[CardResponse]:
    q = select(RepertoireCard).where(RepertoireCard.user_id == user_id)
    if side:
        q = q.where(RepertoireCard.side == side)
    result = await session.execute(q.order_by(RepertoireCard.due.asc()))
    return [CardResponse.model_validate(r) for r in result.scalars()]


async def get_due_cards(
    session: AsyncSession,
    user_id: str,
    limit: int = 20,
) -> list[CardResponse]:
    now = datetime.now(UTC)
    result = await session.execute(
        select(RepertoireCard)
        .where(RepertoireCard.user_id == user_id, RepertoireCard.due <= now)
        .order_by(RepertoireCard.interval_days.asc(), RepertoireCard.due.asc())
        .limit(limit)
    )
    return [CardResponse.model_validate(r) for r in result.scalars()]


async def commit_move(
    session: AsyncSession,
    user_id: str,
    data: CardCreate,
) -> CardResponse:
    stmt = (
        pg_insert(RepertoireCard)
        .values(
            user_id=user_id,
            position_key=data.position_key,
            fen=data.fen,
            side=data.side,
            answer=data.answer,
            line=data.line,
            opening_eco=data.opening_eco,
            opening_name=data.opening_name,
            plan=data.plan,
        )
        .on_conflict_do_update(
            index_elements=["user_id", "position_key"],
            set_={
                "fen": data.fen,
                "side": data.side,
                "answer": data.answer,
                "line": data.line,
                "opening_eco": data.opening_eco,
                "opening_name": data.opening_name,
                "plan": data.plan,
                "updated_at": datetime.now(UTC),
            },
        )
        .returning(RepertoireCard)
    )
    result = await session.execute(stmt)
    row = result.scalar_one()
    await session.commit()
    return CardResponse.model_validate(row)


async def delete_card(
    session: AsyncSession,
    user_id: str,
    position_key: str,
) -> None:
    result = await session.execute(
        delete(RepertoireCard).where(
            RepertoireCard.user_id == user_id,
            RepertoireCard.position_key == position_key,
        )
    )
    if result.rowcount == 0:
        raise NotFoundError("Card not found")
    await session.commit()


async def review_card(
    session: AsyncSession,
    user_id: str,
    position_key: str,
    grade: int,
) -> CardResponse:
    result = await session.execute(
        select(RepertoireCard).where(
            RepertoireCard.user_id == user_id,
            RepertoireCard.position_key == position_key,
        )
    )
    card = result.scalar_one_or_none()
    if card is None:
        raise NotFoundError("Card not found")

    new_ef, new_interval_int, new_reps = compute_sm2(
        ease_factor=card.ease,
        interval_days=int(card.interval_days),
        repetitions=card.reps,
        grade=grade,
    )
    new_state = _next_state(card.state, grade)

    if new_state in ("learning", "relearning"):
        # Override SM-2's computed interval — short-circuit back to 1 day
        # so the card surfaces again tomorrow regardless of prior ease.
        new_interval = _LEARNING_RELEARN_INTERVAL
        if new_state == "relearning":
            card.lapses += 1
    else:
        new_interval = float(new_interval_int)

    card.ease = new_ef
    card.interval_days = new_interval
    card.reps = new_reps
    card.state = new_state
    card.due = datetime.now(UTC) + timedelta(days=new_interval)
    # updated_at is managed by the DB onupdate trigger; no Python assignment needed

    await session.commit()
    return CardResponse.model_validate(card)


async def get_coverage(
    session: AsyncSession,
    user_id: str,
) -> CoverageResponse:
    result = await session.execute(
        select(RepertoireCard.side, func.count().label("cnt"))
        .where(RepertoireCard.user_id == user_id)
        .group_by(RepertoireCard.side)
    )
    counts = {row.side: row.cnt for row in result}
    white = counts.get("white", 0)
    black = counts.get("black", 0)
    return CoverageResponse(white=white, black=black, total=white + black)
