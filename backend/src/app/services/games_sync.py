import asyncio
import re
from datetime import datetime, timezone

import httpx
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.games import Game, SyncedMonth, UserProfile

CHESS_COM_API = "https://api.chess.com/pub/player"
HEADERS = {"User-Agent": "chess-trainer-app/1.0"}


async def fetch_archives(client: httpx.AsyncClient, username: str) -> list[str]:
    resp = await client.get(f"{CHESS_COM_API}/{username}/games/archives", headers=HEADERS)
    resp.raise_for_status()
    return resp.json().get("archives", [])


def _parse_header(pgn: str, tag: str) -> str | None:
    m = re.search(rf'\[{tag}\s+"([^"]*)"\]', pgn)
    return m.group(1) if m else None


def _parse_rating(value: str | None) -> int | None:
    if not value or not value.isdigit():
        return None
    return int(value)


def _parse_moves(pgn: str) -> list[str]:
    # Strip header tags
    body = re.sub(r"\[[^\]]+\]", "", pgn).strip()
    # Remove move numbers, annotations, comments
    body = re.sub(r"\{[^}]*\}", "", body)
    body = re.sub(r"\d+\.(\.\.)?", "", body)
    body = re.sub(r"\$\d+", "", body)
    tokens = body.split()
    result_tokens = {"1-0", "0-1", "1/2-1/2", "*"}
    return [t for t in tokens if t not in result_tokens]


def _parse_played_at(pgn: str) -> datetime | None:
    # chess.com uses UTCDate + UTCTime headers
    date_str = _parse_header(pgn, "UTCDate") or _parse_header(pgn, "Date")
    time_str = _parse_header(pgn, "UTCTime")
    if date_str and date_str != "????.??.??":
        try:
            if time_str:
                dt = datetime.strptime(f"{date_str} {time_str}", "%Y.%m.%d %H:%M:%S")
            else:
                dt = datetime.strptime(date_str, "%Y.%m.%d")
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    return None


def _map_result(raw: str | None) -> str:
    if raw == "1-0":
        return "white_win"
    if raw == "0-1":
        return "black_win"
    return "draw"


def _derive_user_fields(raw_result: str | None, white: str, username: str) -> tuple[str, str]:
    user_color = "white" if white.lower() == username.lower() else "black"
    mapped = _map_result(raw_result)
    if mapped == "draw":
        result = "draw"
    elif mapped == "white_win":
        result = "win" if user_color == "white" else "loss"
    else:
        result = "win" if user_color == "black" else "loss"
    return user_color, result


def parse_game(pgn: str, username: str) -> dict | None:
    url = _parse_header(pgn, "Link") or _parse_header(pgn, "Site") or ""
    # chess.com game URL ends in the game ID
    chess_com_id = url.rstrip("/").split("/")[-1] if url else None
    if not chess_com_id:
        return None

    white = _parse_header(pgn, "White") or ""
    black = _parse_header(pgn, "Black") or ""
    raw_result = _parse_header(pgn, "Result")
    user_color, result = _derive_user_fields(raw_result, white, username)

    return {
        "chess_com_id": chess_com_id,
        "white_username": white,
        "white_rating": _parse_rating(_parse_header(pgn, "WhiteElo")),
        "black_username": black,
        "black_rating": _parse_rating(_parse_header(pgn, "BlackElo")),
        "user_color": user_color,
        "result": result,
        "termination": _parse_header(pgn, "Termination"),
        "time_class": _parse_header(pgn, "TimeClass"),
        "time_control": _parse_header(pgn, "TimeControl"),
        "eco": _parse_header(pgn, "ECO"),
        "opening_name": _parse_header(pgn, "Opening"),
        "moves": _parse_moves(pgn),
        "pgn": pgn,
        "played_at": _parse_played_at(pgn),
    }


async def fetch_month_games(client: httpx.AsyncClient, url: str) -> list[str]:
    resp = await client.get(url, headers=HEADERS)
    resp.raise_for_status()
    data = resp.json()
    # Each game object has a "pgn" key with the full PGN text
    return [g["pgn"] for g in data.get("games", []) if "pgn" in g]


async def _upsert_games(session: AsyncSession, user_id: str, games: list[dict]) -> int:
    if not games:
        return 0
    added = 0
    for g in games:
        result = await session.execute(
            text(
                "INSERT INTO games "
                "(user_id, chess_com_id, white_username, white_rating, black_username, black_rating, "
                "user_color, result, termination, time_class, time_control, eco, opening_name, moves, pgn, played_at) "
                "VALUES (:user_id, :chess_com_id, :white_username, :white_rating, :black_username, :black_rating, "
                ":user_color, :result, :termination, :time_class, :time_control, :eco, :opening_name, :moves, :pgn, :played_at) "
                "ON CONFLICT (user_id, chess_com_id) DO NOTHING"
            ),
            {
                "user_id": user_id,
                "chess_com_id": g["chess_com_id"],
                "white_username": g["white_username"],
                "white_rating": g["white_rating"],
                "black_username": g["black_username"],
                "black_rating": g["black_rating"],
                "user_color": g["user_color"],
                "result": g["result"],
                "termination": g["termination"],
                "time_class": g["time_class"],
                "time_control": g["time_control"],
                "eco": g["eco"],
                "opening_name": g["opening_name"],
                "moves": g["moves"],
                "pgn": g["pgn"],
                "played_at": g["played_at"],
            },
        )
        added += result.rowcount
    await session.commit()
    return added


def _archive_url_to_year_month(url: str) -> tuple[int, int] | None:
    m = re.search(r"/(\d{4})/(\d{2})$", url)
    if not m:
        return None
    return int(m.group(1)), int(m.group(2))


async def run_sync(
    user_id: str,
    username: str,
    session: AsyncSession,
    http_client: httpx.AsyncClient,
) -> None:
    now = datetime.now(timezone.utc)

    # Mark running
    profile_result = await session.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = profile_result.scalar_one()
    profile.sync_status = "running"
    profile.sync_progress = {"current_month": 0, "total_months": 0, "games_added": 0}
    await session.commit()

    try:
        # Determine which months to sync
        synced_result = await session.execute(
            select(SyncedMonth.year, SyncedMonth.month).where(SyncedMonth.user_id == user_id)
        )
        already_synced = {(r.year, r.month) for r in synced_result}
        is_initial = len(already_synced) == 0

        archives = await fetch_archives(http_client, username)
        current_ym = (now.year, now.month)

        if is_initial:
            months_to_sync = [a for a in archives if _archive_url_to_year_month(a) is not None]
        else:
            # Only current month (always re-fetch for new games)
            months_to_sync = [
                a for a in archives
                if _archive_url_to_year_month(a) == current_ym
            ]

        total = len(months_to_sync)
        total_added = 0

        for idx, archive_url in enumerate(months_to_sync):
            ym = _archive_url_to_year_month(archive_url)
            if ym is None:
                continue
            year, month = ym

            if idx > 0:
                await asyncio.sleep(1)

            pgns = await fetch_month_games(http_client, archive_url)
            parsed = [g for pgn in pgns if (g := parse_game(pgn, username)) is not None]
            added = await _upsert_games(session, user_id, parsed)
            total_added += added

            # Upsert synced_month record
            await session.execute(
                text(
                    "INSERT INTO synced_months (user_id, year, month, game_count, synced_at) "
                    "VALUES (:user_id, :year, :month, :game_count, NOW()) "
                    "ON CONFLICT (user_id, year, month) DO UPDATE "
                    "SET game_count = EXCLUDED.game_count, synced_at = NOW()"
                ),
                {"user_id": user_id, "year": year, "month": month, "game_count": len(parsed)},
            )
            await session.commit()

            # Update progress
            profile.sync_progress = {
                "current_month": idx + 1,
                "total_months": total,
                "games_added": total_added,
            }
            profile.sync_status = "running"
            await session.commit()

        profile.sync_status = "done"
        profile.last_sync_at = datetime.now(timezone.utc)
        profile.sync_progress = {
            "current_month": total,
            "total_months": total,
            "games_added": total_added,
        }
        await session.commit()

    except Exception:
        profile.sync_status = "error"
        await session.commit()
        raise
