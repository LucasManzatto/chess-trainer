import logging
from collections.abc import AsyncGenerator

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.v1.games import router as games_router
from .api.v1.openings import router as openings_router
from .api.v1.positions import router as positions_router
from .api.v1.profile import router as profile_router
from .api.v1.train import router as train_router
from .config import settings
from .db import init_db, teardown_db
from .exception_handlers import app_error_handler
from .exceptions import AppError


log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    if not settings.lichess_token:
        log.warning("LICHESS_TOKEN not set — Opening Explorer requests will return 401")
    app.state.http_client = httpx.AsyncClient(follow_redirects=True)
    await init_db()
    yield
    await app.state.http_client.aclose()
    await teardown_db()


app = FastAPI(title="Chess Trainer API", lifespan=lifespan)
app.add_exception_handler(AppError, app_error_handler)  # type: ignore[arg-type]

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(positions_router, prefix="/api/v1")
app.include_router(openings_router, prefix="/api/v1")
app.include_router(profile_router, prefix="/api/v1")
app.include_router(games_router, prefix="/api/v1")
app.include_router(train_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
