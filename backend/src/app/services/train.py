from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import NotFoundError
from ..models.openings import Position
from ..models.repertoires import RepertoireCard
from ..schemas.train import CardCreate, CardResponse, CoverageResponse, StatsResponse
from ..utils.chess import position_key
from .drill import DrillFields, compute_drill_fields, compute_sm2

_GRADE_INTERVAL: dict[int, timedelta] = {
    0: timedelta(seconds=5),
    1: timedelta(seconds=5),
    2: timedelta(days=1),
    3: timedelta(days=3),
    4: timedelta(days=7),
    5: timedelta(days=7),
}


def _next_state(current: str, grade: int) -> str:
    if current in ("new", "learning"):
        return "review" if grade >= 3 else "learning"
    if current == "review":
        return "review" if grade >= 3 else "relearning"
    return "review" if grade >= 3 else "relearning"


def _card_response(card: RepertoireCard, position: Position) -> CardResponse:
    drill: DrillFields = (
        compute_drill_fields(position.moves)
        if position.moves
        else DrillFields(fen=position.fen, line=[], answer="")
    )
    return CardResponse(
        id=card.id,
        position_id=card.position_id,
        side=card.side,
        user_plan=card.user_plan,
        ease=card.ease,
        interval_days=card.interval_days,
        due=card.due,
        reps=card.reps,
        lapses=card.lapses,
        state=card.state,
        name=position.name,
        fen=drill["fen"],
        line=drill["line"],
        answer=drill["answer"],
    )


async def _upsert_position(session: AsyncSession, fen: str, moves: list[str], name: str | None) -> Position:
    stmt = (
        pg_insert(Position)
        .values(fen=fen, position_key=position_key(fen), name=name, moves=moves)
        .on_conflict_do_update(
            index_elements=["position_key"],
            set_={"moves": moves, "name": func.coalesce(name, Position.name)},
        )
        .returning(Position)
    )
    result = await session.execute(stmt)
    return result.scalar_one()


async def list_cards(
    session: AsyncSession,
    user_id: str,
    side: str | None = None,
) -> list[CardResponse]:
    q = (
        select(RepertoireCard, Position)
        .join(Position, Position.id == RepertoireCard.position_id)
        .where(RepertoireCard.user_id == user_id)
    )
    if side:
        q = q.where(RepertoireCard.side == side)
    result = await session.execute(q.order_by(RepertoireCard.due.asc()))
    return [_card_response(card, pos) for card, pos in result]


async def get_due_cards(
    session: AsyncSession,
    user_id: str,
    limit: int = 20,
) -> list[CardResponse]:
    now = datetime.now(UTC)
    result = await session.execute(
        select(RepertoireCard, Position)
        .join(Position, Position.id == RepertoireCard.position_id)
        .where(RepertoireCard.user_id == user_id, RepertoireCard.due <= now)
        .order_by(RepertoireCard.interval_days.asc(), RepertoireCard.due.asc())
        .limit(limit)
    )
    return [_card_response(card, pos) for card, pos in result]


async def commit_move(
    session: AsyncSession,
    user_id: str,
    data: CardCreate,
) -> CardResponse:
    position = await _upsert_position(session, data.fen, data.moves, data.name)

    stmt = (
        pg_insert(RepertoireCard)
        .values(
            user_id=user_id,
            position_id=position.id,
            side=data.side,
            user_plan=data.user_plan,
        )
        .on_conflict_do_update(
            index_elements=["user_id", "position_id"],
            set_={
                "side": data.side,
                "user_plan": data.user_plan,
                "updated_at": datetime.now(UTC),
            },
        )
        .returning(RepertoireCard)
    )
    result = await session.execute(stmt)
    card = result.scalar_one()
    await session.commit()
    return _card_response(card, position)


async def delete_card(
    session: AsyncSession,
    user_id: str,
    position_id: str,
) -> None:
    cursor = await session.execute(
        delete(RepertoireCard).where(
            RepertoireCard.user_id == user_id,
            RepertoireCard.position_id == position_id,
        )
    )
    if cursor.rowcount == 0:
        raise NotFoundError("Card not found")
    await session.commit()


async def review_card(
    session: AsyncSession,
    user_id: str,
    position_id: str,
    grade: int,
) -> CardResponse:
    result = await session.execute(
        select(RepertoireCard, Position)
        .join(Position, Position.id == RepertoireCard.position_id)
        .where(
            RepertoireCard.user_id == user_id,
            RepertoireCard.position_id == position_id,
        )
    )
    row = result.one_or_none()
    if row is None:
        raise NotFoundError("Card not found")
    card, position = row

    new_ef, _, new_reps = compute_sm2(
        ease_factor=card.ease,
        interval_days=int(card.interval_days),
        repetitions=card.reps,
        grade=grade,
    )
    new_state = _next_state(card.state, grade)

    if new_state == "relearning":
        card.lapses += 1

    delta = _GRADE_INTERVAL[grade]
    card.ease = new_ef
    card.interval_days = delta.total_seconds() / 86400
    card.reps = new_reps
    card.state = new_state
    card.due = datetime.now(UTC) + delta

    await session.commit()
    return _card_response(card, position)


async def reset_cards(
    session: AsyncSession,
    user_id: str,
) -> None:
    result = await session.execute(
        select(RepertoireCard).where(RepertoireCard.user_id == user_id)
    )
    cards = result.scalars().all()
    now = datetime.now(UTC)
    for card in cards:
        card.ease = 2.5
        card.interval_days = 1.0
        card.reps = 0
        card.lapses = 0
        card.state = "new"
        card.due = now
    await session.commit()


async def get_stats(
    session: AsyncSession,
    user_id: str,
) -> StatsResponse:
    now = datetime.now(UTC)
    result = await session.execute(
        select(RepertoireCard.state, func.count().label("cnt"))
        .where(RepertoireCard.user_id == user_id)
        .group_by(RepertoireCard.state)
    )
    by_state = {row.state: row.cnt for row in result}

    due_count = await session.scalar(
        select(func.count())
        .where(RepertoireCard.user_id == user_id, RepertoireCard.due <= now)
    )

    total = sum(by_state.values())
    return StatsResponse(
        total=total,
        due=due_count or 0,
        new=by_state.get("new", 0),
        learning=by_state.get("learning", 0),
        review=by_state.get("review", 0),
        relearning=by_state.get("relearning", 0),
    )


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
