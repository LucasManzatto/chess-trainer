from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import ConflictError, NotFoundError
from ..models.openings import (
    Position,
    PositionAnnotationArrow,
    PositionAnnotationCircle,
    PositionAnnotationComment,
)
from ..models.repertoires import RepertoireCard
from ..schemas.openings import (
    PositionAnnotationArrowResponse,
    PositionAnnotationCircleResponse,
    PositionAnnotationCommentCreate,
    PositionAnnotationCommentResponse,
    PositionAnnotationsReplace,
    PositionAnnotationsResponse,
    PositionCreate,
    PositionDetailResponse,
    PositionResponse,
)
from ..utils.chess import position_key


async def _get_position_by_fen(session: AsyncSession, fen: str) -> Position | None:
    result = await session.execute(select(Position).where(Position.position_key == position_key(fen)))
    return result.scalar_one_or_none()


async def _upsert_position_for_fen(session: AsyncSession, fen: str) -> Position:
    stmt = (
        pg_insert(Position)
        .values(fen=fen, position_key=position_key(fen), name=None, moves=[])
        .on_conflict_do_nothing(index_elements=["position_key"])
    )
    await session.execute(stmt)
    pos = await _get_position_by_fen(session, fen)
    assert pos is not None
    return pos


async def get_position(session: AsyncSession, fen: str) -> PositionResponse:
    pos = await _get_position_by_fen(session, fen)
    if pos is None:
        raise NotFoundError("Position not found")
    return PositionResponse.model_validate(pos)


async def get_position_detail(session: AsyncSession, fen: str) -> PositionDetailResponse:
    pos = await _get_position_by_fen(session, fen)

    if pos is None:
        return PositionDetailResponse(position=None, comments=[], arrows=[], circles=[])

    comments_result = await session.execute(
        select(PositionAnnotationComment)
        .where(PositionAnnotationComment.position_id == pos.id)
        .order_by(PositionAnnotationComment.created_at)
    )
    arrows_result = await session.execute(
        select(PositionAnnotationArrow).where(PositionAnnotationArrow.position_id == pos.id)
    )
    circles_result = await session.execute(
        select(PositionAnnotationCircle).where(PositionAnnotationCircle.position_id == pos.id)
    )

    return PositionDetailResponse(
        position=PositionResponse.model_validate(pos),
        comments=[
            PositionAnnotationCommentResponse.model_validate(c) for c in comments_result.scalars()
        ],
        arrows=[PositionAnnotationArrowResponse.model_validate(a) for a in arrows_result.scalars()],
        circles=[
            PositionAnnotationCircleResponse.model_validate(c) for c in circles_result.scalars()
        ],
    )


async def upsert_position(session: AsyncSession, body: PositionCreate) -> PositionResponse:
    key = position_key(body.fen)
    stmt = (
        pg_insert(Position)
        .values(fen=body.fen, position_key=key, name=body.name, moves=body.moves)
        .on_conflict_do_update(
            index_elements=["position_key"],
            set_={"name": func.coalesce(body.name, Position.name), "moves": body.moves},
        )
        .returning(Position)
    )
    result = await session.execute(stmt)
    await session.commit()
    return PositionResponse.model_validate(result.scalar_one())


async def delete_position(session: AsyncSession, fen: str) -> None:
    pos = await _get_position_by_fen(session, fen)
    if pos is None:
        raise NotFoundError("Position not found")
    card_count = await session.scalar(
        select(func.count()).where(RepertoireCard.position_id == pos.id)
    )
    if card_count:
        raise ConflictError("Position has associated drill cards and cannot be deleted")
    await session.execute(delete(Position).where(Position.id == pos.id))
    await session.commit()


async def list_position_comments(
    session: AsyncSession, fen: str
) -> list[PositionAnnotationCommentResponse]:
    pos = await _get_position_by_fen(session, fen)
    if pos is None:
        return []
    result = await session.execute(
        select(PositionAnnotationComment)
        .where(PositionAnnotationComment.position_id == pos.id)
        .order_by(PositionAnnotationComment.created_at)
    )
    return [PositionAnnotationCommentResponse.model_validate(c) for c in result.scalars()]


async def create_position_comment(
    session: AsyncSession, fen: str, body: PositionAnnotationCommentCreate
) -> PositionAnnotationCommentResponse:
    pos = await _upsert_position_for_fen(session, fen)
    comment = PositionAnnotationComment(position_id=pos.id, content=body.content)
    session.add(comment)
    await session.commit()
    return PositionAnnotationCommentResponse.model_validate(comment)


async def update_position_comment(
    session: AsyncSession, comment_id: int, content: str
) -> PositionAnnotationCommentResponse:
    result = await session.execute(
        select(PositionAnnotationComment).where(PositionAnnotationComment.id == comment_id)
    )
    comment = result.scalar_one_or_none()
    if comment is None:
        raise NotFoundError("Comment not found")
    comment.content = content
    await session.commit()
    return PositionAnnotationCommentResponse.model_validate(comment)


async def delete_position_comment(session: AsyncSession, comment_id: int) -> None:
    result = await session.execute(
        delete(PositionAnnotationComment)
        .where(PositionAnnotationComment.id == comment_id)
        .returning(PositionAnnotationComment.id)
    )
    if result.first() is None:
        raise NotFoundError("Comment not found")
    await session.commit()


async def replace_position_annotations(
    session: AsyncSession, fen: str, body: PositionAnnotationsReplace
) -> PositionAnnotationsResponse:
    pos = await _upsert_position_for_fen(session, fen)

    await session.execute(
        delete(PositionAnnotationArrow).where(PositionAnnotationArrow.position_id == pos.id)
    )
    await session.execute(
        delete(PositionAnnotationCircle).where(PositionAnnotationCircle.position_id == pos.id)
    )

    arrows = [
        PositionAnnotationArrow(
            position_id=pos.id,
            from_square=a.from_square,
            to_square=a.to_square,
            color=a.color,
            category=a.category,
            comment=a.comment,
        )
        for a in body.arrows
    ]
    circles = [
        PositionAnnotationCircle(
            position_id=pos.id,
            square=c.square,
            color=c.color,
            category=c.category,
            comment=c.comment,
        )
        for c in body.circles
    ]
    session.add_all(arrows)
    session.add_all(circles)
    await session.commit()

    return PositionAnnotationsResponse(
        arrows=[PositionAnnotationArrowResponse.model_validate(a) for a in arrows],
        circles=[PositionAnnotationCircleResponse.model_validate(c) for c in circles],
    )
