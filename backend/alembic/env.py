import asyncio
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Make src importable
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import app.models.games  # noqa: F401, E402  — registers Game/UserProfile/SyncedMonth tables
import app.models.repertoires  # noqa: F401, E402  — registers RepertoireCard table
from app.models.openings import Base  # noqa: E402  — defines Base and openings tables

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Override sqlalchemy.url from environment if set
_db_url = os.environ.get("DATABASE_URL", "")
if _db_url:
    if _db_url.startswith("postgresql://"):
        _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    # strip sslmode — asyncpg handles ssl differently
    from urllib.parse import parse_qs, urlencode, urlparse, urlunparse
    _parsed = urlparse(_db_url)
    _params = parse_qs(_parsed.query, keep_blank_values=True)
    _params.pop("sslmode", None)
    _params.pop("channel_binding", None)
    _db_url = urlunparse(_parsed._replace(query=urlencode({k: v[0] for k, v in _params.items()})))
    config.set_main_option("sqlalchemy.url", _db_url)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
