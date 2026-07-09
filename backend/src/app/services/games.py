import httpx
from fastapi import BackgroundTasks
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import BadRequestError, ConflictError, NotFoundError
from ..models.games import Game
from ..schemas.games import (
    AnalyzeStatusResponse,
    GameAnalysisCreate,
    GameResponse,
    GameReviewedUpdate,
    GamesListResponse,
    SyncStatusResponse,
)
from .games_analysis import find_critical_moves, run_analysis
from .games_sync import run_sync
from .profile import get_or_create_profile


async def trigger_sync(
    session: AsyncSession,
    user_id: str,
    background_tasks: BackgroundTasks,
    http_client: httpx.AsyncClient,
) -> dict[str, str]:
    profile = await get_or_create_profile(session, user_id)

    if not profile.chess_com_username:
        raise BadRequestError("chess.com username not set")

    if profile.sync_status == "running":
        raise ConflictError("Sync already in progress")

    background_tasks.add_task(run_sync, user_id, profile.chess_com_username, session, http_client)
    return {"detail": "Sync started"}


async def get_sync_status(session: AsyncSession, user_id: str) -> SyncStatusResponse:
    profile = await get_or_create_profile(session, user_id)
    progress = profile.sync_progress or {}
    return SyncStatusResponse(
        status=profile.sync_status,
        current_month=progress.get("current_month"),
        total_months=progress.get("total_months"),
        games_added=progress.get("games_added"),
        last_sync_at=profile.last_sync_at,
    )


async def list_games(
    session: AsyncSession,
    user_id: str,
    result: str | None,
    color: str | None,
    eco: str | None,
    has_critical_moves: bool | None,
    reviewed: bool | None,
    first_critical_move: int | None,
    limit: int,
    offset: int,
) -> GamesListResponse:
    q = select(Game).where(Game.user_id == user_id)

    if result:
        q = q.where(Game.result == result)
    if color:
        q = q.where(Game.user_color == color)
    if eco:
        q = q.where(Game.eco.like(f"{eco}%"))
    if has_critical_moves:
        q = q.where(Game.critical_moves.isnot(None))
        q = q.where(func.cardinality(Game.critical_moves) > 0)
    if reviewed is not None:
        q = q.where(Game.reviewed == reviewed)
    if first_critical_move is not None:
        ply_low = (first_critical_move - 1) * 2
        ply_high = ply_low + 1
        q = q.where(Game.critical_moves.isnot(None))
        q = q.where(func.cardinality(Game.critical_moves) > 0)
        q = q.where(Game.critical_moves[1].between(ply_low, ply_high))

    count_q = select(func.count()).select_from(q.subquery())
    total_result = await session.execute(count_q)
    total = total_result.scalar_one()

    q = q.order_by(Game.played_at.desc()).limit(limit).offset(offset)
    games_result = await session.execute(q)
    games = list(games_result.scalars().all())

    return GamesListResponse(
        items=[GameResponse.model_validate(g) for g in games],
        total=total,
    )


async def save_game_analysis(
    session: AsyncSession,
    game_id: int,
    user_id: str,
    analysis: GameAnalysisCreate,
) -> GameResponse:
    result = await session.execute(
        select(Game).where(Game.id == game_id, Game.user_id == user_id)
    )
    game = result.scalar_one_or_none()
    if game is None:
        raise NotFoundError("Game not found")

    game.analysis = analysis.model_dump(mode="json")
    game.critical_moves = find_critical_moves(
        analysis.moves, analysis.initial_score or 0.0, game.user_color,
    )
    await session.commit()
    await session.refresh(game)
    return GameResponse.model_validate(game)


async def set_game_reviewed(
    session: AsyncSession,
    game_id: int,
    user_id: str,
    update: GameReviewedUpdate,
) -> GameResponse:
    result = await session.execute(
        select(Game).where(Game.id == game_id, Game.user_id == user_id)
    )
    game = result.scalar_one_or_none()
    if game is None:
        raise NotFoundError("Game not found")

    game.reviewed = update.reviewed
    await session.commit()
    await session.refresh(game)
    return GameResponse.model_validate(game)


async def trigger_analyze(
    session: AsyncSession,
    game_id: int,
    user_id: str,
    depth: int,
    background_tasks: BackgroundTasks,
) -> dict[str, str]:
    result = await session.execute(
        select(Game).where(Game.id == game_id, Game.user_id == user_id)
    )
    game = result.scalar_one_or_none()
    if game is None:
        raise NotFoundError("Game not found")

    if game.analyze_status == "running":
        raise ConflictError("Analysis already in progress")

    background_tasks.add_task(run_analysis, game_id, game.moves, depth, session)
    return {"detail": "Analysis started"}


async def get_analyze_status(
    session: AsyncSession,
    game_id: int,
    user_id: str,
) -> AnalyzeStatusResponse:
    result = await session.execute(
        select(Game).where(Game.id == game_id, Game.user_id == user_id)
    )
    game = result.scalar_one_or_none()
    if game is None:
        raise NotFoundError("Game not found")

    progress = game.analyze_progress or {}
    return AnalyzeStatusResponse(
        status=game.analyze_status,
        current=progress.get("current"),
        total=progress.get("total"),
    )
