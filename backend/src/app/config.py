from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    neon_auth_url: str
    allowed_origins: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()  # type: ignore[call-arg]  # pydantic-settings reads from env
