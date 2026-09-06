from contextlib import asynccontextmanager
import logging
import os

from alembic import command
from alembic.config import Config as AlembicConfig
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    auth,
    calculos,
    ensaios,
    pagamentos,
    projetos,
    relatorio,
    users,
)
from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User

API_PREFIX = "/api/v1"
logger = logging.getLogger(__name__)


def _run_alembic_upgrade() -> None:
    """Aplica migrações Alembic até a head no startup."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ini_path = os.path.join(base_dir, "alembic.ini")
    cfg = AlembicConfig(ini_path)
    cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    logger.info("Aplicando migrações Alembic...")
    command.upgrade(cfg, "head")
    logger.info("Migrações aplicadas.")


def _validate_security_settings() -> None:
    """Fail-fast de segredos no startup (não valida no import para não quebrar pytest)."""
    if not settings.SECRET_KEY or len(settings.SECRET_KEY) < 32:
        raise RuntimeError(
            "SECRET_KEY ausente ou fraca (>=32 chars). Defina no .env (ver pass_local.txt / .env.example)."
        )
    if "*" in settings.CORS_ORIGINS:
        logger.warning("CORS_ORIGINS contém '*': valor ignorado (incompatível com allow_credentials).")
    if not settings.CPF_KEY:
        logger.warning("CPF_KEY vazia: CPF será cifrado com chave derivada de SECRET_KEY (ok para dev; em prod defina CPF_KEY própria).")


def _build_allowed_origins() -> list[str]:
    origins = [o for o in settings.CORS_ORIGINS if o and o != "*"]
    if settings.FRONTEND_URL and settings.FRONTEND_URL not in origins:
        origins.append(settings.FRONTEND_URL)
    return origins


@asynccontextmanager
async def lifespan(app: FastAPI):
    _validate_security_settings()
    _run_alembic_upgrade()

    # Seed inicial do admin se configurado
    if settings.ADMIN_EMAIL and settings.ADMIN_PASSWORD:
        db = SessionLocal()
        try:
            admin_existente = db.query(User).filter(User.email == settings.ADMIN_EMAIL.lower()).first()
            if not admin_existente:
                novo_admin = User(
                    nome=settings.ADMIN_NOME,
                    email=settings.ADMIN_EMAIL.lower(),
                    senha_hash=hash_password(settings.ADMIN_PASSWORD),
                    role="admin",
                    email_verificado=True,
                    plano_sempre=True,
                    perfil_completo=True,
                )
                db.add(novo_admin)
                db.commit()
        finally:
            db.close()

    yield


app = FastAPI(
    title="Jar-Test Digital API — Cálculo de Dosagem e Ensaios Laboratoriais",
    description=(
        "API para cálculo de dosagens e diluições de produtos químicos, "
        "dimensionamento de tempos de floculação e decantação, registro físico-químico "
        "e relatórios técnicos de ensaios de Jar Test."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(projetos.router, prefix=API_PREFIX)
app.include_router(calculos.router, prefix=API_PREFIX)
app.include_router(ensaios.router, prefix=API_PREFIX)
app.include_router(relatorio.router, prefix=API_PREFIX)
app.include_router(pagamentos.router, prefix=API_PREFIX)


@app.get("/health")
def health():
    return {"status": "ok", "app": "Jar-Test Digital API"}
