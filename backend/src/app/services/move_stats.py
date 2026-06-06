from datetime import UTC, datetime, timedelta
from typing import Any

import logging

import httpx
from fastapi import HTTPException, status
from sqlalchemy import Text, cast, select
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

log = logging.getLogger(__name__)

from ..config import settings
from ..models.openings import PositionMoveStats
from ..schemas.openings import MoveStat, MoveStatsResponse

LICHESS_EXPLORER = "https://explorer.lichess.ovh/lichess"
CACHE_TTL = timedelta(days=30)


def _build_response(stats: dict[str, Any]) -> MoveStatsResponse:
    total_games = stats["white"] + stats["draws"] + stats["black"]
    move_list: list[MoveStat] = []
    for m in stats["moves"]:
        move_total = m["white"] + m["draws"] + m["black"]
        move_list.append(
            MoveStat(
                san=m["san"],
                uci=m["uci"],
                white=m["white"],
                draws=m["draws"],
                black=m["black"],
                total=move_total,
                percentage=round(move_total / total_games * 100, 1) if total_games > 0 else 0.0,
            )
        )
    return MoveStatsResponse(moves=move_list, total_games=total_games)


async def get_move_stats(
    session: AsyncSession,
    client: httpx.AsyncClient,
    moves: list[str],
) -> MoveStatsResponse:
    result = await session.execute(
        select(PositionMoveStats).where(PositionMoveStats.moves == cast(moves, ARRAY(Text())))
    )
    cached = result.scalar_one_or_none()

    if cached and datetime.now(UTC) - cached.fetched_at.astimezone(UTC) < CACHE_TTL:
        return _build_response(cached.stats)

    lichess_params: dict[str, str] = {
        "ratings": "1600,1800",
        "speeds": "rapid,classical",
    }
    if moves:
        lichess_params["play"] = ",".join(moves)

    headers = {"Authorization": f"Bearer {settings.lichess_token}"} if settings.lichess_token else {}

    try:
        resp = await client.get(LICHESS_EXPLORER, params=lichess_params, headers=headers)
        resp.raise_for_status()
        data = resp.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Lichess Explorer returned {e.response.status_code}",
        ) from e
    except httpx.DecodingError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Lichess Explorer returned malformed JSON",
        ) from e

    stats = {
        "white": data.get("white", 0),
        "draws": data.get("draws", 0),
        "black": data.get("black", 0),
        "moves": data.get("moves", []),
    }

    if cached:
        cached.stats = stats
        flag_modified(cached, "stats")
        cached.fetched_at = datetime.now(UTC)
    else:
        session.add(PositionMoveStats(moves=moves, stats=stats))
    await session.commit()

    return _build_response(stats)
