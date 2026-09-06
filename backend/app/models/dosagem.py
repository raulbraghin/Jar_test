import uuid
from typing import Optional

from sqlalchemy import Float, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DosagensPlanta(Base):
    __tablename__ = "jt_dosagens_planta"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    projeto_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("jt_projetos.id", ondelete="CASCADE"), unique=True, index=True
    )

    # Unidade de entrada do projeto: 'ml_min' ou 'ppm'
    unidade: Mapped[str] = mapped_column(String(10), nullable=False, default="ml_min")

    # Dosagens na ETA (ml/min) — sempre preenchidas (digitadas ou convertidas)
    dosagem_pac_ml_min: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    dosagem_hipo_ml_min: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    dosagem_alc_ml_min: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    dosagem_flu_ml_min: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Dosagens na ETA em ppm (mg/L de ativo) — digitadas ou convertidas
    dosagem_pac_ppm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    dosagem_hipo_ppm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    dosagem_alc_ppm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    dosagem_flu_ppm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Parâmetros dos produtos (usados no modo ppm): concentração % m/m e densidade g/mL
    pac_conc_perc: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pac_densidade: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hipo_conc_perc: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hipo_densidade: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    alc_conc_perc: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    alc_densidade: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    flu_conc_perc: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    flu_densidade: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Doses calculadas para jarro de 2L (mL de solução)
    pac_100_ml: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    pac_10_ml: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    pac_1_ml: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    hipo_100_ml: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    hipo_10_ml: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    hipo_1_ml: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    alc_100_ml: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    alc_10_ml: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    alc_1_ml: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    flu_100_ml: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    flu_10_ml: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    flu_1_ml: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    projeto = relationship("Projeto", back_populates="dosagens")
