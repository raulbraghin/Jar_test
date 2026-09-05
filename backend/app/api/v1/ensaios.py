import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.ensaio import AguaBruta, ResultadoJarro
from app.models.projeto import Projeto
from app.models.user import User
from app.schemas.ensaio import (
    AguaBrutaCreate,
    AguaBrutaOut,
    EnsaioCompletoCreate,
    ResultadoJarroCreate,
    ResultadoJarroOut,
)
from app.services.calculos import avaliar_jarro

router = APIRouter(prefix="/projetos/{projeto_id}/ensaio", tags=["ensaios"])


def _verificar_projeto(projeto_id: uuid.UUID, user_id: uuid.UUID, db: Session) -> Projeto:
    projeto = db.scalar(select(Projeto).where(Projeto.id == projeto_id, Projeto.user_id == user_id))
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return projeto


@router.post("/agua-bruta", response_model=AguaBrutaOut)
def salvar_agua_bruta(
    projeto_id: uuid.UUID,
    payload: AguaBrutaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verificar_projeto(projeto_id, current_user.id, db)

    ab = db.scalar(select(AguaBruta).where(AguaBruta.projeto_id == projeto_id))
    if not ab:
        ab = AguaBruta(projeto_id=projeto_id)
        db.add(ab)

    ab.cor_aparente = payload.cor_aparente
    ab.turbidez = payload.turbidez
    ab.ph = payload.ph
    ab.condutividade = payload.condutividade
    ab.alcalinidade = payload.alcalinidade
    ab.temperatura_c = payload.temperatura_c

    db.commit()
    db.refresh(ab)
    return ab


@router.post("/jarros", response_model=List[ResultadoJarroOut])
def salvar_jarros(
    projeto_id: uuid.UUID,
    payload: List[ResultadoJarroCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verificar_projeto(projeto_id, current_user.id, db)
    ab = db.scalar(select(AguaBruta).where(AguaBruta.projeto_id == projeto_id))
    turbidez_bruta = ab.turbidez if ab else 0.0
    cor_bruta = ab.cor_aparente if ab else 0.0

    # Limpar jarros existentes para salvar nova rodada
    db.execute(delete(ResultadoJarro).where(ResultadoJarro.projeto_id == projeto_id))

    novos_jarros = []
    for item in payload:
        aval = avaliar_jarro(
            turbidez_bruta=turbidez_bruta,
            cor_bruta=cor_bruta,
            turbidez_final=item.turbidez,
            cor_final=item.cor_aparente,
            ph_final=item.ph,
            cloro_final=item.cloro_residual,
            fluor_final=item.fluor,
        )

        jarro = ResultadoJarro(
            projeto_id=projeto_id,
            numero_jarro=item.numero_jarro,
            dose_pac_ml=item.dose_pac_ml,
            dose_hipo_ml=item.dose_hipo_ml,
            dose_alc_ml=item.dose_alc_ml,
            dose_flu_ml=item.dose_flu_ml,
            cor_aparente=item.cor_aparente,
            turbidez=item.turbidez,
            ph=item.ph,
            cloro_residual=item.cloro_residual,
            fluor=item.fluor,
            condutividade=item.condutividade,
            alcalinidade_residual=item.alcalinidade_residual,
            tamanho_floco=item.tamanho_floco,
            velocidade_sedimentacao=item.velocidade_sedimentacao,
            remocao_cor_perc=aval["remocao_cor_perc"],
            remocao_turbidez_perc=aval["remocao_turbidez_perc"],
            atende_potabilidade=aval["atende_potabilidade"],
            jarro_otimo=item.jarro_otimo or False,
        )
        db.add(jarro)
        novos_jarros.append(jarro)

    db.commit()
    for j in novos_jarros:
        db.refresh(j)

    return novos_jarros


@router.post("/completo", response_model=List[ResultadoJarroOut])
def salvar_ensaio_completo(
    projeto_id: uuid.UUID,
    payload: EnsaioCompletoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    salvar_agua_bruta(projeto_id, payload.agua_bruta, db, current_user)
    return salvar_jarros(projeto_id, payload.jarros, db, current_user)
