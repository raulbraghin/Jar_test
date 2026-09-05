import uuid
from typing import Optional

from sqlalchemy import Float, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ConfiguracaoETA(Base):
    __tablename__ = "jt_configuracoes_eta"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    projeto_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("jt_projetos.id", ondelete="CASCADE"), unique=True, index=True
    )

    tipo_eta: Mapped[str] = mapped_column(String(20), nullable=False, default="modular")  # modular | torrezan
    vazao_modulo_ls: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Modular
    qtd_floc_modular: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    diametro_floc_modular: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    altura_floc_modular: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    qtd_dec_modular: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    diametro_dec_modular: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    altura_dec_modular: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Torrezan
    comp_floc_torrezan: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    larg_floc_torrezan: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    alt_floc_torrezan: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    dec_por_floc_torrezan: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    comp_dec_torrezan: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    larg_dec_torrezan: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    alt_dec_torrezan: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Calculados
    vol_floc_unit_m3: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    vol_floc_total_m3: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    vol_dec_unit_m3: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    vol_dec_total_m3: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    tempo_floc_seg: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    tempo_dec_seg: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    projeto = relationship("Projeto", back_populates="configuracao")
