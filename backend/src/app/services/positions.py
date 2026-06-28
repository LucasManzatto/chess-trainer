import logging
import time

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import ConflictError, NotFoundError
from ..models.openings import Position, PositionComment, PositionMove
from ..models.repertoires import RepertoireCard
from ..schemas.openings import (
    PositionCommentCreate,
    PositionCommentResponse,
    PositionCreate,
    PositionMoveCreate,
    PositionMoveResponse,
    PositionMoveUpdate,
    PositionResponse,
)


async def get_position(session: AsyncSession, fen: str) -> PositionResponse:
    result = await session.execute(select(Position).where(Position.fen == fen))
    pos = result.scalar_one_or_none()
    if pos is None:
        raise NotFoundError("Position not found")
    return PositionResponse.model_validate(pos)


async def upsert_position(session: AsyncSession, body: PositionCreate) -> PositionResponse:
    stmt = (
        pg_insert(Position)
        .values(fen=body.fen, name=body.name, moves=body.moves)
        .on_conflict_do_update(
            index_elements=["fen"],
            set_={"name": func.coalesce(body.name, Position.name), "moves": body.moves},
        )
        .returning(Position)
    )
    result = await session.execute(stmt)
    await session.commit()
    return PositionResponse.model_validate(result.scalar_one())


async def delete_position(session: AsyncSession, fen: str) -> None:
    pos_result = await session.execute(select(Position).where(Position.fen == fen))
    pos = pos_result.scalar_one_or_none()
    if pos is None:
        raise NotFoundError("Position not found")
    card_count = await session.scalar(
        select(func.count()).where(RepertoireCard.position_id == pos.id)
    )
    if card_count:
        raise ConflictError("Position has associated drill cards and cannot be deleted")
    await session.execute(delete(Position).where(Position.id == pos.id))
    await session.commit()


logger = logging.getLogger(__name__)


async def list_position_moves(session: AsyncSession, fen: str) -> list[PositionMoveResponse]:
    t0 = time.perf_counter()
    result = await session.execute(
        select(PositionMove)
        .join(Position, Position.id == PositionMove.from_position_id)
        .where(Position.fen == fen)
        .order_by(PositionMove.is_main_line.desc(), PositionMove.san)
    )
    t_db = time.perf_counter()

    rows = [PositionMoveResponse.model_validate(m) for m in result.scalars()]
    t_serialize = time.perf_counter()

    logger.info(
        "list_position_moves fen=%r db=%.1fms serialize=%.1fms total=%.1fms rows=%d",
        fen,
        (t_db - t0) * 1000,
        (t_serialize - t_db) * 1000,
        (t_serialize - t0) * 1000,
        len(rows),
    )
    return rows


async def create_position_move(session: AsyncSession, body: PositionMoveCreate) -> PositionMoveResponse:
    # DO NOTHING returns no rows on conflict; no-op DO UPDATE forces RETURNING to return existing row
    from_pos_result = await session.execute(
        pg_insert(Position)
        .values(fen=body.from_fen, name=None, moves=[])
        .on_conflict_do_update(index_elements=["fen"], set_={"fen": body.from_fen})
        .returning(Position)
    )
    from_pos = from_pos_result.scalar_one()

    to_pos_result = await session.execute(
        pg_insert(Position)
        .values(fen=body.to_fen, name=None, moves=[])
        .on_conflict_do_update(index_elements=["fen"], set_={"fen": body.to_fen})
        .returning(Position)
    )
    to_pos = to_pos_result.scalar_one()

    move_result = await session.execute(
        pg_insert(PositionMove)
        .values(
            from_position_id=from_pos.id,
            to_position_id=to_pos.id,
            san=body.san,
            lan=body.lan,
            is_main_line=body.is_main_line,
            commentary=body.commentary,
        )
        .returning(PositionMove)
    )
    await session.commit()
    return PositionMoveResponse.model_validate(move_result.scalar_one())


async def update_position_move(
    session: AsyncSession, move_id: str, body: PositionMoveUpdate
) -> PositionMoveResponse:
    result = await session.execute(select(PositionMove).where(PositionMove.id == move_id))
    move = result.scalar_one_or_none()
    if move is None:
        raise NotFoundError("Position move not found")
    if body.is_main_line is not None:
        move.is_main_line = body.is_main_line
    if "commentary" in body.model_fields_set:
        move.commentary = body.commentary
    await session.commit()
    return PositionMoveResponse.model_validate(move)


async def delete_position_move(session: AsyncSession, move_id: str) -> None:
    result = await session.execute(
        delete(PositionMove).where(PositionMove.id == move_id).returning(PositionMove.id)
    )
    if result.first() is None:
        raise NotFoundError("Position move not found")
    await session.commit()


async def list_position_comments(
    session: AsyncSession, user_id: str, fen: str
) -> list[PositionCommentResponse]:
    result = await session.execute(
        select(PositionComment)
        .join(Position, Position.id == PositionComment.position_id)
        .where(PositionComment.user_id == user_id, Position.fen == fen)
        .order_by(PositionComment.created_at)
    )
    return [PositionCommentResponse.model_validate(c) for c in result.scalars()]


async def create_position_comment(
    session: AsyncSession, user_id: str, fen: str, body: PositionCommentCreate
) -> PositionCommentResponse:
    pos_result = await session.execute(
        pg_insert(Position)
        .values(fen=fen, name=None, moves=[])
        .on_conflict_do_update(index_elements=["fen"], set_={"fen": fen})
        .returning(Position)
    )
    pos = pos_result.scalar_one()
    comment = PositionComment(user_id=user_id, position_id=pos.id, content=body.content)
    session.add(comment)
    await session.commit()
    return PositionCommentResponse.model_validate(comment)


async def update_position_comment(
    session: AsyncSession, user_id: str, comment_id: int, content: str
) -> PositionCommentResponse:
    result = await session.execute(
        select(PositionComment).where(
            PositionComment.id == comment_id, PositionComment.user_id == user_id
        )
    )
    comment = result.scalar_one_or_none()
    if comment is None:
        raise NotFoundError("Comment not found")
    comment.content = content
    await session.commit()
    return PositionCommentResponse.model_validate(comment)


async def delete_position_comment(
    session: AsyncSession, user_id: str, comment_id: int
) -> None:
    result = await session.execute(
        delete(PositionComment)
        .where(PositionComment.id == comment_id, PositionComment.user_id == user_id)
        .returning(PositionComment.id)
    )
    if result.first() is None:
        raise NotFoundError("Comment not found")
    await session.commit()
