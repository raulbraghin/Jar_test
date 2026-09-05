from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.configuracao import ConfiguracaoETAOut
from app.schemas.dosagem import DosagensPlantaOut
from app.schemas.ensaio import AguaBrutaOut, ResultadoJarroOut


class ProjetoCreate(BaseModel):
    nome_projeto: str = Field(..., min_length=2, max_length=255)
    cliente: Optional[str] = Field(None, max_length=255)
    autor: Optional[str] = Field(None, max_length=255)
    descricao: Optional[str] = None
    data_ensaio: Optional[datetime] = None


class ProjetoUpdate(BaseModel):
    nome_projeto: Optional[str] = Field(None, min_length=2, max_length=255)
    cliente: Optional[str] = Field(None, max_length=255)
    autor: Optional[str] = Field(None, max_length=255)
    descricao: Optional[str] = None
    data_ensaio: Optional[datetime] = None


class ProjetoListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nome_projeto: str
    cliente: Optional[str] = None
    autor: Optional[str] = None
    data_ensaio: datetime
    criado_em: datetime
    tipo_eta: Optional[str] = None
    vazao_modulo_ls: Optional[float] = None
    total_jarros: int = 0
    tem_jarro_otimo: bool = False


class ProjetoDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    nome_projeto: str
    cliente: Optional[str] = None
    autor: Optional[str] = None
    descricao: Optional[str] = None
    data_ensaio: datetime
    criado_em: datetime
    atualizado_em: datetime

    configuracao: Optional[ConfiguracaoETAOut] = None
    dosagens: Optional[DosagensPlantaOut] = None
    agua_bruta: Optional[AguaBrutaOut] = None
    jarros: list[ResultadoJarroOut] = []
