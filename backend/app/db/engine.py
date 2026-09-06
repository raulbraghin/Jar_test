from sqlalchemy import create_engine
from app.core.config import settings

# pool_pre_ping/pool_size/max_overflow são específicos do PostgreSQL (QueuePool).
# Para SQLite (testes) usa-se o pool default, sem esses argumentos.
_pool_opts = {}
if settings.DATABASE_URL.startswith("postgresql"):
    _pool_opts = {
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
    }

engine = create_engine(settings.DATABASE_URL, echo=False, **_pool_opts)
