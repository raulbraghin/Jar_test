import uuid
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.projeto import Projeto
from app.models.user import User

router = APIRouter(prefix="/projetos/{projeto_id}/relatorio", tags=["relatorio"])


@router.get("/", response_model=Dict[str, Any])
def gerar_relatorio_tecnico(
    projeto_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Projeto)
        .options(
            joinedload(Projeto.configuracao),
            joinedload(Projeto.dosagens),
            joinedload(Projeto.agua_bruta),
            joinedload(Projeto.jarros),
        )
        .where(Projeto.id == projeto_id, Projeto.user_id == current_user.id)
    )
    projeto = db.scalar(stmt)
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    conf = projeto.configuracao
    dos = projeto.dosagens
    ab = projeto.agua_bruta
    jarros = projeto.jarros or []

    jarro_otimo = next((j for j in jarros if j.jarro_otimo), None)
    if not jarro_otimo and jarros:
        # Se nenhum foi marcado como ótimo manualmente, seleciona o que atende com menor dose de coagulante ou menor turbidez
        conformes = [j for j in jarros if j.atende_potabilidade]
        if conformes:
            jarro_otimo = min(conformes, key=lambda x: x.turbidez)
        else:
            jarro_otimo = min(jarros, key=lambda x: x.turbidez)

    # Instruções práticas de preparo de soluções no laboratório
    instrucoes_preparo = [
        {
            "produto": "PAC (Policloreto de Alumínio)",
            "solucao_10_perc": "Pipetar 10 mL do produto comercial concentrado e avolumar para 100 mL com água destilada em balão volumétrico.",
            "solucao_1_perc": "Pipetar 1 mL do produto comercial (ou 10 mL da solução a 10%) e avolumar para 100 mL com água destilada.",
        },
        {
            "produto": "Hipoclorito de Sódio",
            "solucao_10_perc": "Pipetar 10 mL do hipoclorito comercial e avolumar para 100 mL com água destilada em balão âmbar protegido de luz.",
            "solucao_1_perc": "Pipetar 1 mL do comercial e avolumar para 100 mL com água destilada.",
        },
        {
            "produto": "Alcalinizante (ex: Hidróxido de Sódio / Cal)",
            "solucao_10_perc": "Dissolver 10 g do reagente ou 10 mL da solução alcalina e avolumar para 100 mL.",
            "solucao_1_perc": "Diluir 10 mL da solução a 10% para 100 mL com água destilada.",
        },
        {
            "produto": "Ácido Fluorsilíssico (Fluoreto)",
            "solucao_10_perc": "Pipetar 10 mL do produto comercial com EPIs adequados e avolumar para 100 mL.",
            "solucao_1_perc": "Diluir 10 mL da solução a 10% para 100 mL com água destilada.",
        },
    ]

    return {
        "projeto": {
            "id": str(projeto.id),
            "nome_projeto": projeto.nome_projeto,
            "cliente": projeto.cliente,
            "autor": projeto.autor,
            "descricao": projeto.descricao,
            "data_ensaio": projeto.data_ensaio.isoformat() if projeto.data_ensaio else None,
            "criado_em": projeto.criado_em.isoformat(),
        },
        "configuracao_eta": {
            "tipo_eta": conf.tipo_eta if conf else "modular",
            "vazao_modulo_ls": conf.vazao_modulo_ls if conf else 0.0,
            "vol_floc_unit_m3": conf.vol_floc_unit_m3 if conf else 0.0,
            "vol_floc_total_m3": conf.vol_floc_total_m3 if conf else 0.0,
            "vol_dec_unit_m3": conf.vol_dec_unit_m3 if conf else 0.0,
            "vol_dec_total_m3": conf.vol_dec_total_m3 if conf else 0.0,
            "tempo_floc_seg": conf.tempo_floc_seg if conf else 0,
            "tempo_dec_seg": conf.tempo_dec_seg if conf else 0,
        } if conf else None,
        "dosagens_planta": {
            "dosagem_pac_ml_min": dos.dosagem_pac_ml_min if dos else 0.0,
            "dosagem_hipo_ml_min": dos.dosagem_hipo_ml_min if dos else 0.0,
            "dosagem_alc_ml_min": dos.dosagem_alc_ml_min if dos else 0.0,
            "dosagem_flu_ml_min": dos.dosagem_flu_ml_min if dos else 0.0,
            "pac": {"c100": dos.pac_100_ml, "c10": dos.pac_10_ml, "c1": dos.pac_1_ml} if dos else None,
            "hipo": {"c100": dos.hipo_100_ml, "c10": dos.hipo_10_ml, "c1": dos.hipo_1_ml} if dos else None,
            "alc": {"c100": dos.alc_100_ml, "c10": dos.alc_10_ml, "c1": dos.alc_1_ml} if dos else None,
            "flu": {"c100": dos.flu_100_ml, "c10": dos.flu_10_ml, "c1": dos.flu_1_ml} if dos else None,
        } if dos else None,
        "agua_bruta": {
            "cor_aparente": ab.cor_aparente if ab else 0.0,
            "turbidez": ab.turbidez if ab else 0.0,
            "ph": ab.ph if ab else 7.0,
            "condutividade": ab.condutividade if ab else 0.0,
            "alcalinidade": ab.alcalinidade if ab else 0.0,
            "temperatura_c": ab.temperatura_c if ab else None,
        } if ab else None,
        "jarros": [
            {
                "id": str(j.id),
                "numero_jarro": j.numero_jarro,
                "dose_pac_ml": j.dose_pac_ml,
                "dose_hipo_ml": j.dose_hipo_ml,
                "dose_alc_ml": j.dose_alc_ml,
                "dose_flu_ml": j.dose_flu_ml,
                "cor_aparente": j.cor_aparente,
                "turbidez": j.turbidez,
                "ph": j.ph,
                "cloro_residual": j.cloro_residual,
                "fluor": j.fluor,
                "condutividade": j.condutividade,
                "alcalinidade_residual": j.alcalinidade_residual,
                "tamanho_floco": j.tamanho_floco,
                "velocidade_sedimentacao": j.velocidade_sedimentacao,
                "remocao_cor_perc": j.remocao_cor_perc,
                "remocao_turbidez_perc": j.remocao_turbidez_perc,
                "atende_potabilidade": j.atende_potabilidade,
                "jarro_otimo": j.id == jarro_otimo.id if jarro_otimo else False,
            }
            for j in jarros
        ],
        "jarro_otimo": {
            "numero_jarro": jarro_otimo.numero_jarro,
            "dose_pac_ml": jarro_otimo.dose_pac_ml,
            "turbidez_final": jarro_otimo.turbidez,
            "cor_final": jarro_otimo.cor_aparente,
            "ph_final": jarro_otimo.ph,
            "remocao_turbidez": jarro_otimo.remocao_turbidez_perc,
            "remocao_cor": jarro_otimo.remocao_cor_perc,
        } if jarro_otimo else None,
        "instrucoes_preparo": instrucoes_preparo,
        "norma_referencia": "Portaria GM/MS nº 888/2021 (Padrão de Potabilidade de Água para Consumo Humano)",
    }
