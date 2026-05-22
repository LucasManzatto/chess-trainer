from collections.abc import AsyncGenerator

import asyncpg

from .config import settings

_pool: asyncpg.Pool | None = None


async def create_pool() -> None:
    global _pool
    _pool = await asyncpg.create_pool(settings.database_url)


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


async def get_conn() -> AsyncGenerator[asyncpg.Connection, None]:
    if _pool is None:
        raise RuntimeError("DB pool not initialised — call create_pool() in lifespan")
    async with _pool.acquire() as conn:
        yield conn
