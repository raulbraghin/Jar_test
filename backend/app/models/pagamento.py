import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Pagamento(Base):
    """Auditoria de pagamentos (MercadoPago) e proteção contra webhook duplicado."""

    __tablename__ = "jt_pagamentos"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("jt_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Idempotência: um mesmo payment do MercadoPago só pode estender o plano uma vez.
    mp_payment_id: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True, index=True
    )
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)  # mensal | trimestral | anual
    valor: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # approved|pending|rejected|cancelled
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    aprovado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="pagamentos")
