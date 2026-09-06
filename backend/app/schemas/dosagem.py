from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class DosagensPlantaCreate(BaseModel):
    unidade: Literal["ml_min", "ppm"] = Field("ml_min", description="Unidade de entrada: ml_min ou ppm")

    dosagem_pac_ml_min: float = Field(0.0, ge=0, description="Dose de PAC na ETA em ml/min")
    dosagem_hipo_ml_min: float = Field(0.0, ge=0, description="Dose de Hipoclorito na ETA em ml/min")
    dosagem_alc_ml_min: float = Field(0.0, ge=0, description="Dose de Alcalinizante na ETA em ml/min")
    dosagem_flu_ml_min: float = Field(0.0, ge=0, description="Dose de Ácido Fluorsilíssico na ETA em ml/min")

    dosagem_pac_ppm: Optional[float] = Field(None, ge=0, description="Dose de PAC em ppm (mg/L)")
    dosagem_hipo_ppm: Optional[float] = Field(None, ge=0, description="Dose de Hipoclorito em ppm (mg/L)")
    dosagem_alc_ppm: Optional[float] = Field(None, ge=0, description="Dose de Alcalinizante em ppm (mg/L)")
    dosagem_flu_ppm: Optional[float] = Field(None, ge=0, description="Dose de Fluoreto em ppm (mg/L)")

    pac_conc_perc: Optional[float] = Field(None, gt=0, le=100, description="PAC: concentração % m/m do ativo")
    pac_densidade: Optional[float] = Field(None, gt=0, description="PAC: densidade do produto (g/mL)")
    hipo_conc_perc: Optional[float] = Field(None, gt=0, le=100)
    hipo_densidade: Optional[float] = Field(None, gt=0)
    alc_conc_perc: Optional[float] = Field(None, gt=0, le=100)
    alc_densidade: Optional[float] = Field(None, gt=0)
    flu_conc_perc: Optional[float] = Field(None, gt=0, le=100)
    flu_densidade: Optional[float] = Field(None, gt=0)


class DosagensPlantaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    projeto_id: UUID
    unidade: str = "ml_min"

    dosagem_pac_ml_min: float
    dosagem_hipo_ml_min: float
    dosagem_alc_ml_min: float
    dosagem_flu_ml_min: float

    dosagem_pac_ppm: float = 0.0
    dosagem_hipo_ppm: float = 0.0
    dosagem_alc_ppm: float = 0.0
    dosagem_flu_ppm: float = 0.0

    pac_conc_perc: Optional[float] = None
    pac_densidade: Optional[float] = None
    hipo_conc_perc: Optional[float] = None
    hipo_densidade: Optional[float] = None
    alc_conc_perc: Optional[float] = None
    alc_densidade: Optional[float] = None
    flu_conc_perc: Optional[float] = None
    flu_densidade: Optional[float] = None

    pac_100_ml: float
    pac_10_ml: float
    pac_1_ml: float

    hipo_100_ml: float
    hipo_10_ml: float
    hipo_1_ml: float

    alc_100_ml: float
    alc_10_ml: float
    alc_1_ml: float

    flu_100_ml: float
    flu_10_ml: float
    flu_1_ml: float
