from sqlalchemy import delete, func, literal, select
from sqlalchemy.dialects.postgresql import aggregate_order_by
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


async def get_position(session: AsyncSession, fen: str) -> PositionResponse:
    result = await session.execute(select(Position).where(Position.fen == fen))
    pos = result.scalar_one_or_none()
    if pos is None:
        raise NotFoundError("Position not found")
    return PositionResponse.model_validate(pos)


async def get_position_detail(session: AsyncSession, fen: str) -> PositionDetailResponse:
    fen_row = select(literal(fen, type_=Position.fen.type).label("fen")).subquery("f")

    comments_json = (
        select(
            func.json_agg(
                aggregate_order_by(
                    func.json_build_object(
                        "id", PositionAnnotationComment.id,
                        "fen", PositionAnnotationComment.fen,
                        "content", PositionAnnotationComment.content,
                        "created_at", PositionAnnotationComment.created_at,
                    ),
                    PositionAnnotationComment.created_at,
                )
            )
        )
        .where(PositionAnnotationComment.fen == fen_row.c.fen)
        .correlate(fen_row)
        .scalar_subquery()
    )

    arrows_json = (
        select(
            func.json_agg(
                func.json_build_object(
                    "id", PositionAnnotationArrow.id,
                    "fen", PositionAnnotationArrow.fen,
                    "from_square", PositionAnnotationArrow.from_square,
                    "to_square", PositionAnnotationArrow.to_square,
                    "color", PositionAnnotationArrow.color,
                )
            )
        )
        .where(PositionAnnotationArrow.fen == fen_row.c.fen)
        .correlate(fen_row)
        .scalar_subquery()
    )

    circles_json = (
        select(
            func.json_agg(
                func.json_build_object(
                    "id", PositionAnnotationCircle.id,
                    "fen", PositionAnnotationCircle.fen,
                    "square", PositionAnnotationCircle.square,
                    "color", PositionAnnotationCircle.color,
                )
            )
        )
        .where(PositionAnnotationCircle.fen == fen_row.c.fen)
        .correlate(fen_row)
        .scalar_subquery()
    )

    stmt = (
        select(
            Position.id, Position.fen, Position.name, Position.moves, Position.created_at,
            comments_json, arrows_json, circles_json,
        )
        .select_from(fen_row.outerjoin(Position, Position.fen == fen_row.c.fen))
    )
    row = (await session.execute(stmt)).one()

    position = (
        PositionResponse(id=row[0], fen=row[1], name=row[2], moves=row[3], created_at=row[4])
        if row[0] is not None
        else None
    )

    return PositionDetailResponse(
        position=position,
        comments=[PositionAnnotationCommentResponse(**c) for c in (row[5] or [])],
        arrows=[PositionAnnotationArrowResponse(**a) for a in (row[6] or [])],
        circles=[PositionAnnotationCircleResponse(**c) for c in (row[7] or [])],
    )


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


async def list_position_comments(
    session: AsyncSession, fen: str
) -> list[PositionAnnotationCommentResponse]:
    result = await session.execute(
        select(PositionAnnotationComment)
        .where(PositionAnnotationComment.fen == fen)
        .order_by(PositionAnnotationComment.created_at)
    )
    return [PositionAnnotationCommentResponse.model_validate(c) for c in result.scalars()]


async def create_position_comment(
    session: AsyncSession, fen: str, body: PositionAnnotationCommentCreate
) -> PositionAnnotationCommentResponse:
    await session.execute(
        pg_insert(Position)
        .values(fen=fen, name=None, moves=[])
        .on_conflict_do_update(index_elements=["fen"], set_={"fen": fen})
    )
    comment = PositionAnnotationComment(fen=fen, content=body.content)
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
    await session.execute(
        pg_insert(Position)
        .values(fen=fen, name=None, moves=[])
        .on_conflict_do_update(index_elements=["fen"], set_={"fen": fen})
    )
    await session.execute(
        delete(PositionAnnotationArrow).where(PositionAnnotationArrow.fen == fen)
    )
    await session.execute(
        delete(PositionAnnotationCircle).where(PositionAnnotationCircle.fen == fen)
    )

    arrows = [
        PositionAnnotationArrow(
            fen=fen, from_square=a.from_square, to_square=a.to_square, color=a.color
        )
        for a in body.arrows
    ]
    circles = [
        PositionAnnotationCircle(fen=fen, square=c.square, color=c.color) for c in body.circles
    ]
    session.add_all(arrows)
    session.add_all(circles)
    await session.commit()

    return PositionAnnotationsResponse(
        arrows=[PositionAnnotationArrowResponse.model_validate(a) for a in arrows],
        circles=[PositionAnnotationCircleResponse.model_validate(c) for c in circles],
    )
