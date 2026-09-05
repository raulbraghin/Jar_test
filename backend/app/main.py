from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    auth,
    calculos,
    ensaios,
    projetos,
    relatorio,
    users,
)
from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.engine import engine
from app.db.session import SessionLocal
from app.models.user import User

API_PREFIX = "/api/v1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Criação das tabelas do Jar Test com prefixo jt_*
    Base.metadata.create_all(bind=engine)

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
                )
                db.add(novo_admin)
                db.commit()
        finally:
            db.close()

    yield


app = FastAPI(
    title="Jar Test API — Cálculo de Dosagem e Ensaios Laboratoriais",
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
    allow_origins=settings.CORS_ORIGINS,
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


@app.get("/health")
def health():
    return {"status": "ok", "app": "Jar Test API"}
