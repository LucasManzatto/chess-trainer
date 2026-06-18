from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import NotFoundError
from ..models.openings import Position, PositionComment, UserPosition
from ..schemas.openings import (
    PositionCommentCreate,
    PositionCommentResponse,
    PositionCreate,
    PositionResponse,
)


async def upsert_position(session: AsyncSession, body: PositionCreate) -> PositionResponse:
    stmt = (
        pg_insert(Position)
        .values(fen=body.fen, eco=body.eco, name=body.name, pgn=body.pgn, moves=body.moves)
        .on_conflict_do_update(
            index_elements=["fen"],
            set_={"eco": body.eco, "name": body.name, "pgn": body.pgn, "moves": body.moves},
        )
        .returning(Position)
    )
    result = await session.execute(stmt)
    await session.commit()
    return PositionResponse.model_validate(result.scalar_one())


async def list_user_positions(session: AsyncSession, user_id: str) -> list[PositionResponse]:
    result = await session.execute(
        select(Position)
        .join(UserPosition, UserPosition.fen == Position.fen)
        .where(UserPosition.user_id == user_id)
        .order_by(UserPosition.saved_at.desc())
    )
    return [PositionResponse.model_validate(p) for p in result.scalars()]


async def save_user_position(session: AsyncSession, user_id: str, fen: str) -> PositionResponse:
    pos_stmt = (
        pg_insert(Position)
        .values(fen=fen, eco=None, name=None, pgn=None, moves=[])
        .on_conflict_do_update(index_elements=["fen"], set_={"fen": fen})
        .returning(Position)
    )
    result = await session.execute(pos_stmt)
    pos = result.scalar_one()

    await session.execute(
        pg_insert(UserPosition)
        .values(user_id=user_id, fen=fen)
        .on_conflict_do_nothing()
    )
    await session.commit()
    return PositionResponse.model_validate(pos)


async def remove_user_position(session: AsyncSession, user_id: str, fen: str) -> None:
    result = await session.execute(
        delete(UserPosition)
        .where(UserPosition.user_id == user_id, UserPosition.fen == fen)
        .returning(UserPosition.fen)
    )
    if result.first() is None:
        raise NotFoundError("Position not in user's list")
    await session.commit()


async def list_position_comments(
    session: AsyncSession, user_id: str, fen: str
) -> list[PositionCommentResponse]:
    result = await session.execute(
        select(PositionComment)
        .where(PositionComment.user_id == user_id, PositionComment.fen == fen)
        .order_by(PositionComment.created_at)
    )
    return [PositionCommentResponse.model_validate(c) for c in result.scalars()]


async def create_position_comment(
    session: AsyncSession, user_id: str, fen: str, body: PositionCommentCreate
) -> PositionCommentResponse:
    await session.execute(
        pg_insert(Position)
        .values(fen=fen, eco=None, name=None, pgn=None, moves=[])
        .on_conflict_do_nothing()
    )
    comment = PositionComment(user_id=user_id, fen=fen, content=body.content)
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
