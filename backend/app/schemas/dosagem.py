from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class DosagensPlantaCreate(BaseModel):
    dosagem_pac_ml_min: float = Field(..., ge=0, description="Dose de PAC na ETA em ml/min")
    dosagem_hipo_ml_min: float = Field(..., ge=0, description="Dose de Hipoclorito na ETA em ml/min")
    dosagem_alc_ml_min: float = Field(..., ge=0, description="Dose de Alcalinizante na ETA em ml/min")
    dosagem_flu_ml_min: float = Field(..., ge=0, description="Dose de Ácido Fluorsilíssico na ETA em ml/min")


class DosagensPlantaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    projeto_id: UUID
    dosagem_pac_ml_min: float
    dosagem_hipo_ml_min: float
    dosagem_alc_ml_min: float
    dosagem_flu_ml_min: float

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
