from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://localhost/noded_alright"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24
    jwt_remember_me_days: int = 30
    vault_encryption_key: str = ""
    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_claims_email: str = "admin@nodedright.com"
    frontend_url: str = "http://localhost:5173"


settings = Settings()
