from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AguaBrutaCreate(BaseModel):
    cor_aparente: float = Field(..., ge=0, description="Cor aparente da água bruta (uH)")
    turbidez: float = Field(..., ge=0, description="Turbidez da água bruta (uT / NTU)")
    ph: float = Field(..., ge=0, le=14, description="pH da água bruta")
    condutividade: float = Field(..., ge=0, description="Condutividade elétrica (µS/cm)")
    alcalinidade: float = Field(..., ge=0, description="Alcalinidade total (mg/L CaCO3)")
    temperatura_c: Optional[float] = Field(None, description="Temperatura da água (°C)")


class AguaBrutaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    projeto_id: UUID
    cor_aparente: float
    turbidez: float
    ph: float
    condutividade: float
    alcalinidade: float
    temperatura_c: Optional[float] = None


class ResultadoJarroCreate(BaseModel):
    numero_jarro: int = Field(..., ge=1, le=12, description="Número identificador do jarro (1 a 6)")
    dose_pac_ml: Optional[float] = Field(None, ge=0, description="Dose de PAC aplicada (mL)")
    dose_hipo_ml: Optional[float] = Field(None, ge=0, description="Dose de Hipoclorito aplicada (mL)")
    dose_alc_ml: Optional[float] = Field(None, ge=0, description="Dose de Alcalinizante aplicada (mL)")
    dose_flu_ml: Optional[float] = Field(None, ge=0, description="Dose de Flúor aplicada (mL)")
    dose_pac_ppm: Optional[float] = Field(None, ge=0, description="Dose de PAC aplicada (ppm)")
    dose_hipo_ppm: Optional[float] = Field(None, ge=0, description="Dose de Hipoclorito aplicada (ppm)")
    dose_alc_ppm: Optional[float] = Field(None, ge=0, description="Dose de Alcalinizante aplicada (ppm)")
    dose_flu_ppm: Optional[float] = Field(None, ge=0, description="Dose de Flúor aplicada (ppm)")

    cor_aparente: float = Field(..., ge=0, description="Cor aparente final (uH)")
    turbidez: float = Field(..., ge=0, description="Turbidez final (uT / NTU)")
    ph: float = Field(..., ge=0, le=14, description="pH final")
    cloro_residual: float = Field(..., ge=0, description="Cloro residual livre (mg/L)")
    fluor: float = Field(..., ge=0, description="Flúor final (mg/L)")
    condutividade: float = Field(..., ge=0, description="Condutividade final (µS/cm)")
    alcalinidade_residual: Optional[float] = Field(None, ge=0, description="Alcalinidade residual (mg/L CaCO3)")

    tamanho_floco: Optional[str] = Field(None, max_length=50)
    velocidade_sedimentacao: Optional[str] = Field(None, max_length=50)
    jarro_otimo: Optional[bool] = False


class ResultadoJarroOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    projeto_id: UUID
    numero_jarro: int
    dose_pac_ml: Optional[float] = None
    dose_hipo_ml: Optional[float] = None
    dose_alc_ml: Optional[float] = None
    dose_flu_ml: Optional[float] = None
    dose_pac_ppm: Optional[float] = None
    dose_hipo_ppm: Optional[float] = None
    dose_alc_ppm: Optional[float] = None
    dose_flu_ppm: Optional[float] = None

    cor_aparente: float
    turbidez: float
    ph: float
    cloro_residual: float
    fluor: float
    condutividade: float
    alcalinidade_residual: Optional[float] = None

    tamanho_floco: Optional[str] = None
    velocidade_sedimentacao: Optional[str] = None

    remocao_cor_perc: float
    remocao_turbidez_perc: float
    atende_potabilidade: bool
    jarro_otimo: bool


class EnsaioCompletoCreate(BaseModel):
    agua_bruta: AguaBrutaCreate
    jarros: list[ResultadoJarroCreate]
