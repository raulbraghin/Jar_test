from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ConfiguracaoETACreate(BaseModel):
    tipo_eta: str = Field(..., pattern="^(modular|torrezan)$")
    vazao_modulo_ls: float = Field(..., gt=0, description="Vazão do módulo em L/s")

    # Modular
    qtd_floc_modular: Optional[int] = Field(None, ge=1)
    diametro_floc_modular: Optional[float] = Field(None, gt=0)
    altura_floc_modular: Optional[float] = Field(None, gt=0)

    qtd_dec_modular: Optional[int] = Field(None, ge=1)
    diametro_dec_modular: Optional[float] = Field(None, gt=0)
    altura_dec_modular: Optional[float] = Field(None, gt=0)

    # Torrezan
    comp_floc_torrezan: Optional[float] = Field(None, gt=0)
    larg_floc_torrezan: Optional[float] = Field(None, gt=0)
    alt_floc_torrezan: Optional[float] = Field(None, gt=0)

    dec_por_floc_torrezan: Optional[int] = Field(None, ge=1)
    comp_dec_torrezan: Optional[float] = Field(None, gt=0)
    larg_dec_torrezan: Optional[float] = Field(None, gt=0)
    alt_dec_torrezan: Optional[float] = Field(None, gt=0)


class ConfiguracaoETAOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    projeto_id: UUID
    tipo_eta: str
    vazao_modulo_ls: float

    qtd_floc_modular: Optional[int] = None
    diametro_floc_modular: Optional[float] = None
    altura_floc_modular: Optional[float] = None

    qtd_dec_modular: Optional[int] = None
    diametro_dec_modular: Optional[float] = None
    altura_dec_modular: Optional[float] = None

    comp_floc_torrezan: Optional[float] = None
    larg_floc_torrezan: Optional[float] = None
    alt_floc_torrezan: Optional[float] = None

    dec_por_floc_torrezan: Optional[int] = None
    comp_dec_torrezan: Optional[float] = None
    larg_dec_torrezan: Optional[float] = None
    alt_dec_torrezan: Optional[float] = None

    vol_floc_unit_m3: float
    vol_floc_total_m3: float
    vol_dec_unit_m3: float
    vol_dec_total_m3: float
    tempo_floc_seg: int
    tempo_dec_seg: int
