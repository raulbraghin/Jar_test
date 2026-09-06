from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Sem senha default no código: definir via .env (ver pass_local.txt / .env.example).
    DATABASE_URL: str = "postgresql+psycopg://eta_user@localhost:5432/eta_db"
    # Obrigatório em prod: validado no startup (main.py). Vazio aqui para não quebrar import/pytest.
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Nunca ["*"] com allow_credentials=True. Lista explícita via env; FRONTEND_URL entra na whitelist no main.py.
    CORS_ORIGINS: list[str] = []

    FRONTEND_URL: str = "http://localhost:8002"
    EMAIL_TOKEN_EXPIRE_HOURS: int = 24

    # Chave Fernet (cpf) — base64 url-safe 32 bytes. Se vazia, derivada de SECRET_KEY (dev apenas; em prod definir CPF_KEY própria).
    CPF_KEY: str = ""

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
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

    # Seed do admin só executa se ADMIN_EMAIL e ADMIN_PASSWORD estiverem definidos (ver main.py).
    ADMIN_EMAIL: str = ""
    ADMIN_PASSWORD: str = ""
    ADMIN_NOME: str = "Administrador Jar Test"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
