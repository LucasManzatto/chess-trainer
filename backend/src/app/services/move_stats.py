from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

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
        select(PositionMoveStats).where(PositionMoveStats.moves == moves)
    )
    cached = result.scalar_one_or_none()

    if cached and datetime.now(UTC) - cached.fetched_at.astimezone(UTC) < CACHE_TTL:
        return _build_response(cached.stats)

    params: dict[str, str] = {
        "ratings": "2000,2200,2500",
        "speeds": "blitz,rapid,classical",
    }
    if moves:
        params["play"] = ",".join(moves)

    try:
        resp = await client.get(LICHESS_EXPLORER, params=params)
        resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Lichess Explorer returned {e.response.status_code}",
        ) from e
    data = resp.json()

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
