from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE if _ENV_FILE.exists() else None,
        extra="ignore",
    )

    database_url: str
    neon_auth_url: str
    allowed_origins: list[str] = ["http://localhost:5173"]
    lichess_token: str | None = None
    stockfish_path: str = "stockfish"


settings = Settings()  # type: ignore[call-arg]  # pydantic-settings reads from env
