from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.openings import OpeningComment, PositionComment
from ..schemas.openings import OpeningCommentResponse, PositionCommentResponse


async def list_opening_comments(
    session: AsyncSession,
    user_id: str,
    opening_id: int,
) -> list[OpeningCommentResponse]:
    result = await session.execute(
        select(OpeningComment)
        .where(OpeningComment.user_id == user_id, OpeningComment.opening_id == opening_id)
        .order_by(OpeningComment.created_at)
    )
    return [OpeningCommentResponse.model_validate(r) for r in result.scalars()]


async def create_opening_comment(
    session: AsyncSession,
    user_id: str,
    opening_id: int,
    content: str,
) -> OpeningCommentResponse:
    comment = OpeningComment(user_id=user_id, opening_id=opening_id, content=content)
    session.add(comment)
    await session.commit()
    return OpeningCommentResponse.model_validate(comment)


async def update_opening_comment(
    session: AsyncSession,
    user_id: str,
    comment_id: int,
    content: str,
) -> OpeningCommentResponse:
    result = await session.execute(
        select(OpeningComment).where(
            OpeningComment.id == comment_id, OpeningComment.user_id == user_id
        )
    )
    comment = result.scalar_one_or_none()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    comment.content = content
    await session.commit()
    return OpeningCommentResponse.model_validate(comment)


async def delete_opening_comment(
    session: AsyncSession,
    user_id: str,
    comment_id: int,
) -> None:
    result = await session.execute(
        delete(OpeningComment)
        .where(OpeningComment.id == comment_id, OpeningComment.user_id == user_id)
        .returning(OpeningComment.id)
    )
    if result.first() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    await session.commit()


async def list_position_comments(
    session: AsyncSession,
    user_id: str,
    opening_id: int,
) -> list[PositionCommentResponse]:
    result = await session.execute(
        select(PositionComment)
        .where(PositionComment.user_id == user_id, PositionComment.opening_id == opening_id)
        .order_by(PositionComment.move_index, PositionComment.created_at)
    )
    return [PositionCommentResponse.model_validate(r) for r in result.scalars()]


async def create_position_comment(
    session: AsyncSession,
    user_id: str,
    opening_id: int,
    move_index: int,
    fen: str,
    content: str,
) -> PositionCommentResponse:
    comment = PositionComment(
        user_id=user_id,
        opening_id=opening_id,
        move_index=move_index,
        fen=fen,
        content=content,
    )
    session.add(comment)
    await session.commit()
    return PositionCommentResponse.model_validate(comment)


async def update_position_comment(
    session: AsyncSession,
    user_id: str,
    comment_id: int,
    content: str,
) -> PositionCommentResponse:
    result = await session.execute(
        select(PositionComment).where(
            PositionComment.id == comment_id, PositionComment.user_id == user_id
        )
    )
    comment = result.scalar_one_or_none()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    comment.content = content
    await session.commit()
    return PositionCommentResponse.model_validate(comment)


async def delete_position_comment(
    session: AsyncSession,
    user_id: str,
    comment_id: int,
) -> None:
    result = await session.execute(
        delete(PositionComment)
        .where(PositionComment.id == comment_id, PositionComment.user_id == user_id)
        .returning(PositionComment.id)
    )
    if result.first() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    await session.commit()
