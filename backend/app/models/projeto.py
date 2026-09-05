import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Projeto(Base):
    __tablename__ = "jt_projetos"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("jt_users.id", ondelete="CASCADE"), index=True
    )
    nome_projeto: Mapped[str] = mapped_column(String(255), nullable=False)
    cliente: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    autor: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    descricao: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    data_ensaio: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="projetos")
    configuracao = relationship(
        "ConfiguracaoETA", back_populates="projeto", uselist=False, cascade="all, delete-orphan"
    )
    dosagens = relationship(
        "DosagensPlanta", back_populates="projeto", uselist=False, cascade="all, delete-orphan"
    )
    agua_bruta = relationship(
        "AguaBruta", back_populates="projeto", uselist=False, cascade="all, delete-orphan"
    )
    jarros = relationship(
        "ResultadoJarro", back_populates="projeto", cascade="all, delete-orphan", order_by="ResultadoJarro.numero_jarro"
    )
