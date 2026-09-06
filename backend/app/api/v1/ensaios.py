import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.dosagem import DosagensPlanta
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
from app.services import planos
from app.services.calculos import avaliar_jarro, ml_jarro_para_ppm, ppm_jarro_para_ml

router = APIRouter(prefix="/projetos/{projeto_id}/ensaio", tags=["ensaios"])


def _verificar_projeto(projeto_id: uuid.UUID, user_id: uuid.UUID, db: Session) -> Projeto:
    projeto = db.scalar(select(Projeto).where(Projeto.id == projeto_id, Projeto.user_id == user_id))
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return projeto


def _verificar_limite_gratis(user: User) -> None:
    """Plano grátis: no máx. LIMITE_GRATIS_ENSAIOS por janela deslizante."""
    if planos.usuario_premium(user):
        return
    usados = planos.usos_na_janela(user)
    if usados >= settings.LIMITE_GRATIS_ENSAIOS:
        raise HTTPException(
            status_code=402,
            detail={
                "code": "LIMITE_ATINGIDO",
                "mensagem": (
                    f"Você atingiu o limite de ensaios do plano grátis "
                    f"({usados}/{settings.LIMITE_GRATIS_ENSAIOS} por "
                    f"{settings.JANELA_GRATIS_DIAS} dias). Assine um plano para "
                    "ensaios ilimitados."
                ),
            },
        )


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
    _verificar_limite_gratis(current_user)
    ab = db.scalar(select(AguaBruta).where(AguaBruta.projeto_id == projeto_id))
    turbidez_bruta = ab.turbidez if ab else 0.0
    cor_bruta = ab.cor_aparente if ab else 0.0

    dos = db.scalar(select(DosagensPlanta).where(DosagensPlanta.projeto_id == projeto_id))
    params = {
        "pac": ((dos.pac_conc_perc or 0) if dos else 0, (dos.pac_densidade or 0) if dos else 0),
        "hipo": ((dos.hipo_conc_perc or 0) if dos else 0, (dos.hipo_densidade or 0) if dos else 0),
        "alc": ((dos.alc_conc_perc or 0) if dos else 0, (dos.alc_densidade or 0) if dos else 0),
        "flu": ((dos.flu_conc_perc or 0) if dos else 0, (dos.flu_densidade or 0) if dos else 0),
    }

    def _ambas(v_ml, v_ppm, conc, dens):
        """Completa o par (mL, ppm) a partir do lado informado."""
        if v_ppm is not None and v_ml is None and conc and dens:
            v_ml = ppm_jarro_para_ml(v_ppm, conc, dens)
        elif v_ml is not None and v_ppm is None and conc and dens:
            v_ppm = ml_jarro_para_ppm(v_ml, conc, dens)
        return v_ml, v_ppm

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

        pac_ml, pac_ppm = _ambas(item.dose_pac_ml, item.dose_pac_ppm, *params["pac"])
        hipo_ml, hipo_ppm = _ambas(item.dose_hipo_ml, item.dose_hipo_ppm, *params["hipo"])
        alc_ml, alc_ppm = _ambas(item.dose_alc_ml, item.dose_alc_ppm, *params["alc"])
        flu_ml, flu_ppm = _ambas(item.dose_flu_ml, item.dose_flu_ppm, *params["flu"])

        jarro = ResultadoJarro(
            projeto_id=projeto_id,
            numero_jarro=item.numero_jarro,
            dose_pac_ml=pac_ml,
            dose_hipo_ml=hipo_ml,
            dose_alc_ml=alc_ml,
            dose_flu_ml=flu_ml,
            dose_pac_ppm=pac_ppm,
            dose_hipo_ppm=hipo_ppm,
            dose_alc_ppm=alc_ppm,
            dose_flu_ppm=flu_ppm,
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

    # Plano grátis: registra o ensaio usado apenas após salvar com sucesso.
    if not planos.usuario_premium(current_user):
        planos.registrar_uso(current_user)
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
