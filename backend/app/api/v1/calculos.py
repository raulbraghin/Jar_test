import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.configuracao import ConfiguracaoETA
from app.models.dosagem import DosagensPlanta
from app.models.projeto import Projeto
from app.models.user import User
from app.schemas.configuracao import ConfiguracaoETACreate, ConfiguracaoETAOut
from app.schemas.dosagem import DosagensPlantaCreate, DosagensPlantaOut
from app.services.calculos import (
    calcular_diluicoes_jarro_2l,
    calcular_hidraulica_modular,
    calcular_hidraulica_torrezan,
    ml_min_para_ppm,
    ppm_para_ml_min,
)

router = APIRouter(prefix="/projetos/{projeto_id}", tags=["calculos"])


def _verificar_projeto(projeto_id: uuid.UUID, user_id: uuid.UUID, db: Session) -> Projeto:
    projeto = db.scalar(select(Projeto).where(Projeto.id == projeto_id, Projeto.user_id == user_id))
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return projeto


@router.post("/configuracao", response_model=ConfiguracaoETAOut)
def salvar_configuracao_eta(
    projeto_id: uuid.UUID,
    payload: ConfiguracaoETACreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projeto = _verificar_projeto(projeto_id, current_user.id, db)

    if payload.tipo_eta == "modular":
        if not (
            payload.qtd_floc_modular
            and payload.diametro_floc_modular
            and payload.altura_floc_modular
            and payload.qtd_dec_modular
            and payload.diametro_dec_modular
            and payload.altura_dec_modular
        ):
            raise HTTPException(status_code=422, detail="Preencha todas as dimensões da ETA Modular")

        hidraulica = calcular_hidraulica_modular(
            vazao_ls=payload.vazao_modulo_ls,
            qtd_floc=payload.qtd_floc_modular,
            dia_floc=payload.diametro_floc_modular,
            alt_floc=payload.altura_floc_modular,
            qtd_dec=payload.qtd_dec_modular,
            dia_dec=payload.diametro_dec_modular,
            alt_dec=payload.altura_dec_modular,
        )
    else:
        if not (
            payload.comp_floc_torrezan
            and payload.larg_floc_torrezan
            and payload.alt_floc_torrezan
            and payload.dec_por_floc_torrezan
            and payload.comp_dec_torrezan
            and payload.larg_dec_torrezan
            and payload.alt_dec_torrezan
        ):
            raise HTTPException(status_code=422, detail="Preencha todas as dimensões da ETA Torrezan")

        hidraulica = calcular_hidraulica_torrezan(
            vazao_ls=payload.vazao_modulo_ls,
            comp_floc=payload.comp_floc_torrezan,
            larg_floc=payload.larg_floc_torrezan,
            alt_floc=payload.alt_floc_torrezan,
            dec_por_floc=payload.dec_por_floc_torrezan,
            comp_dec=payload.comp_dec_torrezan,
            larg_dec=payload.larg_dec_torrezan,
            alt_dec=payload.alt_dec_torrezan,
        )

    config = db.scalar(select(ConfiguracaoETA).where(ConfiguracaoETA.projeto_id == projeto_id))
    if not config:
        config = ConfiguracaoETA(projeto_id=projeto_id)
        db.add(config)

    config.tipo_eta = payload.tipo_eta
    config.vazao_modulo_ls = payload.vazao_modulo_ls

    config.qtd_floc_modular = payload.qtd_floc_modular
    config.diametro_floc_modular = payload.diametro_floc_modular
    config.altura_floc_modular = payload.altura_floc_modular
    config.qtd_dec_modular = payload.qtd_dec_modular
    config.diametro_dec_modular = payload.diametro_dec_modular
    config.altura_dec_modular = payload.altura_dec_modular

    config.comp_floc_torrezan = payload.comp_floc_torrezan
    config.larg_floc_torrezan = payload.larg_floc_torrezan
    config.alt_floc_torrezan = payload.alt_floc_torrezan
    config.dec_por_floc_torrezan = payload.dec_por_floc_torrezan
    config.comp_dec_torrezan = payload.comp_dec_torrezan
    config.larg_dec_torrezan = payload.larg_dec_torrezan
    config.alt_dec_torrezan = payload.alt_dec_torrezan

    config.vol_floc_unit_m3 = hidraulica["vol_floc_unit_m3"]
    config.vol_floc_total_m3 = hidraulica["vol_floc_total_m3"]
    config.vol_dec_unit_m3 = hidraulica["vol_dec_unit_m3"]
    config.vol_dec_total_m3 = hidraulica["vol_dec_total_m3"]
    config.tempo_floc_seg = hidraulica["tempo_floc_seg"]
    config.tempo_dec_seg = hidraulica["tempo_dec_seg"]

    db.commit()
    db.refresh(config)
    return config


@router.post("/dosagens", response_model=DosagensPlantaOut)
def salvar_dosagens_planta(
    projeto_id: uuid.UUID,
    payload: DosagensPlantaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projeto = _verificar_projeto(projeto_id, current_user.id, db)
    config = db.scalar(select(ConfiguracaoETA).where(ConfiguracaoETA.projeto_id == projeto_id))
    if not config or config.vazao_modulo_ls <= 0:
        raise HTTPException(
            status_code=400,
            detail="Configure primeiro a geometria e a vazão da ETA antes de calcular dosagens.",
        )

    vazao = config.vazao_modulo_ls
    unidade = payload.unidade or "ml_min"
    if unidade not in ("ml_min", "ppm"):
        raise HTTPException(status_code=422, detail="Unidade deve ser 'ml_min' ou 'ppm'.")

    params = {
        "pac": (payload.pac_conc_perc, payload.pac_densidade, payload.dosagem_pac_ml_min, payload.dosagem_pac_ppm),
        "hipo": (payload.hipo_conc_perc, payload.hipo_densidade, payload.dosagem_hipo_ml_min, payload.dosagem_hipo_ppm),
        "alc": (payload.alc_conc_perc, payload.alc_densidade, payload.dosagem_alc_ml_min, payload.dosagem_alc_ppm),
        "flu": (payload.flu_conc_perc, payload.flu_densidade, payload.dosagem_flu_ml_min, payload.dosagem_flu_ppm),
    }

    ml_min: dict[str, float] = {}
    ppm: dict[str, float] = {}
    for nome, (conc, dens, v_ml, v_ppm) in params.items():
        if unidade == "ppm":
            if (v_ppm or 0) > 0 and (not conc or not dens):
                raise HTTPException(
                    status_code=422,
                    detail=f"Informe concentração (% m/m) e densidade (g/mL) de {nome} para calcular em ppm.",
                )
            ppm[nome] = v_ppm or 0.0
            ml_min[nome] = ppm_para_ml_min(ppm[nome], vazao, conc or 0, dens or 0)
        else:
            ml_min[nome] = v_ml or 0.0
            ppm[nome] = ml_min_para_ppm(ml_min[nome], vazao, conc or 0, dens or 0) if conc and dens else 0.0

    pac = calcular_diluicoes_jarro_2l(ml_min["pac"], vazao)
    hipo = calcular_diluicoes_jarro_2l(ml_min["hipo"], vazao)
    alc = calcular_diluicoes_jarro_2l(ml_min["alc"], vazao)
    flu = calcular_diluicoes_jarro_2l(ml_min["flu"], vazao)

    dos = db.scalar(select(DosagensPlanta).where(DosagensPlanta.projeto_id == projeto_id))
    if not dos:
        dos = DosagensPlanta(projeto_id=projeto_id)
        db.add(dos)

    dos.unidade = unidade
    dos.dosagem_pac_ml_min = ml_min["pac"]
    dos.dosagem_hipo_ml_min = ml_min["hipo"]
    dos.dosagem_alc_ml_min = ml_min["alc"]
    dos.dosagem_flu_ml_min = ml_min["flu"]

    dos.dosagem_pac_ppm = ppm["pac"]
    dos.dosagem_hipo_ppm = ppm["hipo"]
    dos.dosagem_alc_ppm = ppm["alc"]
    dos.dosagem_flu_ppm = ppm["flu"]

    dos.pac_conc_perc = payload.pac_conc_perc
    dos.pac_densidade = payload.pac_densidade
    dos.hipo_conc_perc = payload.hipo_conc_perc
    dos.hipo_densidade = payload.hipo_densidade
    dos.alc_conc_perc = payload.alc_conc_perc
    dos.alc_densidade = payload.alc_densidade
    dos.flu_conc_perc = payload.flu_conc_perc
    dos.flu_densidade = payload.flu_densidade

    dos.pac_100_ml = pac["c100"]
    dos.pac_10_ml = pac["c10"]
    dos.pac_1_ml = pac["c1"]

    dos.hipo_100_ml = hipo["c100"]
    dos.hipo_10_ml = hipo["c10"]
    dos.hipo_1_ml = hipo["c1"]

    dos.alc_100_ml = alc["c100"]
    dos.alc_10_ml = alc["c10"]
    dos.alc_1_ml = alc["c1"]

    dos.flu_100_ml = flu["c100"]
    dos.flu_10_ml = flu["c10"]
    dos.flu_1_ml = flu["c1"]

    db.commit()
    db.refresh(dos)
    return dos
