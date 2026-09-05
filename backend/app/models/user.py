import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "jt_users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="engenheiro")
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    email_verificado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Suporte a plano pago
    plano_ate: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    plano_sempre: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ensaios_usados: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    janela_inicio: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    projetos = relationship("Projeto", back_populates="user", cascade="all, delete-orphan")

    @property
    def pago(self) -> bool:
        if self.plano_sempre:
            return True
        if not self.plano_ate:
            return False
        limite = self.plano_ate
        if limite.tzinfo is None:
            limite = limite.replace(tzinfo=timezone.utc)
        return limite > datetime.now(timezone.utc)
