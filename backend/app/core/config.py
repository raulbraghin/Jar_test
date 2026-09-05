from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql+psycopg://eta_user:eta_password_secure@localhost:5432/eta_db"
    SECRET_KEY: str = "jartest-secret-key-super-secure-change-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: list[str] = ["*"]

    FRONTEND_URL: str = "http://localhost:8002"
    EMAIL_TOKEN_EXPIRE_HOURS: int = 24

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "sidecc.r.transmissao@gmail.com"
    SMTP_PASSWORD: str = "bups dzsw kowi oqxm"
    SMTP_FROM: str = "sidecc.r.transmissao@gmail.com"
    SMTP_TLS: bool = True

    # Planos pagos (futuro)
    PLANO_MENSAL_PRECO: float = 9.99
    PLANO_TRIMESTRAL_PRECO: float = 26.99
    PLANO_ANUAL_PRECO: float = 99.99
    PLANO_MENSAL_DIAS: int = 30
    PLANO_TRIMESTRAL_DIAS: int = 90
    PLANO_ANUAL_DIAS: int = 365
    LIMITE_GRATIS_ENSAIOS: int = 3
    JANELA_GRATIS_DIAS: int = 7

    ADMIN_EMAIL: str = "admin@jartest.com"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_NOME: str = "Administrador Jar Test"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
