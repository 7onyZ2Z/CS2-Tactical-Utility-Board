from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "change-me-to-a-random-string-in-production"
    DATABASE_URL: str = "sqlite:///./utility_lookup.db"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    MAX_IMAGE_SIZE_MB: int = 10
    MAX_VIDEO_SIZE_MB: int = 50
    UPLOAD_DIR: str = "uploads"

    model_config = {"env_file": ".env"}


settings = Settings()
