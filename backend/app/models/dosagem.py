import uuid

from sqlalchemy import Float, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DosagensPlanta(Base):
    __tablename__ = "jt_dosagens_planta"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    projeto_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("jt_projetos.id", ondelete="CASCADE"), unique=True, index=True
    )

    # Dosagens na ETA (ml/min)
    dosagem_pac_ml_min: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    dosagem_hipo_ml_min: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    dosagem_alc_ml_min: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    dosagem_flu_ml_min: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

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
