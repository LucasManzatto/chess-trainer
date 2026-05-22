import asyncpg
from fastapi import HTTPException, status

from ..schemas.openings import (
    OpeningCommentResponse,
    PositionCommentResponse,
)


async def list_opening_comments(
    conn: asyncpg.Connection,
    user_id: str,
    opening_id: int,
) -> list[OpeningCommentResponse]:
    rows = await conn.fetch(
        "SELECT * FROM opening_comments WHERE user_id = $1 AND opening_id = $2 ORDER BY created_at",
        user_id,
        opening_id,
    )
    return [OpeningCommentResponse(**dict(r)) for r in rows]


async def create_opening_comment(
    conn: asyncpg.Connection,
    user_id: str,
    opening_id: int,
    content: str,
) -> OpeningCommentResponse:
    row = await conn.fetchrow(
        "INSERT INTO opening_comments (user_id, opening_id, content)"
        " VALUES ($1, $2, $3) RETURNING *",
        user_id,
        opening_id,
        content,
    )
    return OpeningCommentResponse(**dict(row))


async def update_opening_comment(
    conn: asyncpg.Connection,
    user_id: str,
    comment_id: int,
    content: str,
) -> OpeningCommentResponse:
    row = await conn.fetchrow(
        "UPDATE opening_comments SET content = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
        content,
        comment_id,
        user_id,
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    return OpeningCommentResponse(**dict(row))


async def delete_opening_comment(
    conn: asyncpg.Connection,
    user_id: str,
    comment_id: int,
) -> None:
    result = await conn.execute(
        "DELETE FROM opening_comments WHERE id = $1 AND user_id = $2",
        comment_id,
        user_id,
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")


async def list_position_comments(
    conn: asyncpg.Connection,
    user_id: str,
    opening_id: int,
) -> list[PositionCommentResponse]:
    rows = await conn.fetch(
        "SELECT * FROM position_comments WHERE user_id = $1 AND opening_id = $2"
        " ORDER BY move_index, created_at",
        user_id,
        opening_id,
    )
    return [PositionCommentResponse(**dict(r)) for r in rows]


async def create_position_comment(
    conn: asyncpg.Connection,
    user_id: str,
    opening_id: int,
    move_index: int,
    fen: str,
    content: str,
) -> PositionCommentResponse:
    row = await conn.fetchrow(
        "INSERT INTO position_comments (user_id, opening_id, move_index, fen, content)"
        " VALUES ($1, $2, $3, $4, $5) RETURNING *",
        user_id,
        opening_id,
        move_index,
        fen,
        content,
    )
    return PositionCommentResponse(**dict(row))


async def update_position_comment(
    conn: asyncpg.Connection,
    user_id: str,
    comment_id: int,
    content: str,
) -> PositionCommentResponse:
    row = await conn.fetchrow(
        "UPDATE position_comments SET content = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
        content,
        comment_id,
        user_id,
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    return PositionCommentResponse(**dict(row))


async def delete_position_comment(
    conn: asyncpg.Connection,
    user_id: str,
    comment_id: int,
) -> None:
    result = await conn.execute(
        "DELETE FROM position_comments WHERE id = $1 AND user_id = $2",
        comment_id,
        user_id,
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
