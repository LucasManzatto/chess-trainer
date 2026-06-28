from collections.abc import AsyncGenerator
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from .config import settings

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None

_SSL_MODES = {"require", "verify-ca", "verify-full", "allow", "prefer"}


def _async_url_and_connect_args() -> tuple[str, dict[str, object]]:
    raw = settings.database_url
    if raw.startswith("postgresql://"):
        raw = raw.replace("postgresql://", "postgresql+asyncpg://", 1)

    parsed = urlparse(raw)
    params = parse_qs(parsed.query, keep_blank_values=True)

    connect_args: dict[str, object] = {}
    ssl_mode_list = params.pop("sslmode", [])
    params.pop("channel_binding", None)

    if ssl_mode_list and ssl_mode_list[0] in _SSL_MODES:
        connect_args["ssl"] = True

    new_query = urlencode({k: v[0] for k, v in params.items()})
    clean_url = urlunparse(parsed._replace(query=new_query))
    return clean_url, connect_args


async def init_db() -> None:
    global _engine, _session_factory
    url, connect_args = _async_url_and_connect_args()
    _engine = create_async_engine(
        url,
        connect_args={
            **connect_args,
            "timeout": 30,
            "prepared_statement_cache_size": 0,  # pgBouncer transaction mode rejects PREPARE
        },
        pool_pre_ping=True,
    )
    _session_factory = async_sessionmaker(_engine, expire_on_commit=False)


async def teardown_db() -> None:
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    if _session_factory is None:
        raise RuntimeError("DB engine not initialised — call init_db() in lifespan")
    async with _session_factory() as session:
        yield session
