from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    neon_auth_url: str
    allowed_origins: list[str] = ["http://localhost:5173"]


settings = Settings()  # type: ignore[call-arg]  # pydantic-settings reads from env
