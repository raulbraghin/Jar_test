import uuid
from typing import Optional

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AguaBruta(Base):
    __tablename__ = "jt_agua_bruta"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    projeto_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("jt_projetos.id", ondelete="CASCADE"), unique=True, index=True
    )

    cor_aparente: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)      # uH
    turbidez: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)          # uT / NTU
    ph: Mapped[float] = mapped_column(Float, nullable=False, default=7.0)
    condutividade: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)     # µS/cm
    alcalinidade: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)      # mg/L CaCO3
    temperatura_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    projeto = relationship("Projeto", back_populates="agua_bruta")


class ResultadoJarro(Base):
    __tablename__ = "jt_resultados_jarros"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    projeto_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("jt_projetos.id", ondelete="CASCADE"), index=True
    )

    numero_jarro: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 a 6

    # Doses aplicadas no jarro específico (mL de solução)
    dose_pac_ml: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dose_hipo_ml: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dose_alc_ml: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dose_flu_ml: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Resultados físico-químicos pós-ensaio
    cor_aparente: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)      # uH
    turbidez: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)          # uT / NTU
    ph: Mapped[float] = mapped_column(Float, nullable=False, default=7.0)
    cloro_residual: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)    # mg/L Cl2
    fluor: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)             # mg/L F-
    condutividade: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)     # µS/cm
    alcalinidade_residual: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # mg/L CaCO3

    # Características visuais e cinéticas
    tamanho_floco: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    velocidade_sedimentacao: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Eficiências calculadas (%)
    remocao_cor_perc: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    remocao_turbidez_perc: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Avaliação de conformidade (Portaria GM/MS nº 888/2021)
    atende_potabilidade: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    jarro_otimo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    projeto = relationship("Projeto", back_populates="jarros")
