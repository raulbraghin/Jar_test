import math
from typing import Any


def calcular_hidraulica_modular(
    vazao_ls: float,
    qtd_floc: int,
    dia_floc: float,
    alt_floc: float,
    qtd_dec: int,
    dia_dec: float,
    alt_dec: float,
) -> dict[str, Any]:
    """Calcula volumes e tempos de detenção para ETA Modular cilíndrica."""
    area_floc = math.pi * ((dia_floc / 2.0) ** 2)
    vol_floc_unit = area_floc * alt_floc
    vol_floc_total = vol_floc_unit * qtd_floc

    area_dec = math.pi * ((dia_dec / 2.0) ** 2)
    vol_dec_unit = area_dec * alt_dec
    vol_dec_total = vol_dec_unit * qtd_dec

    tempo_floc = int((vol_floc_unit * 1000.0) / vazao_ls) if vazao_ls > 0 else 0
    vazao_por_dec = (vazao_ls / qtd_dec) if qtd_dec > 0 else vazao_ls
    tempo_dec = int((vol_dec_unit * 1000.0) / vazao_por_dec) if vazao_por_dec > 0 else 0

    return {
        "vol_floc_unit_m3": round(vol_floc_unit, 4),
        "vol_floc_total_m3": round(vol_floc_total, 4),
        "vol_dec_unit_m3": round(vol_dec_unit, 4),
        "vol_dec_total_m3": round(vol_dec_total, 4),
        "tempo_floc_seg": tempo_floc,
        "tempo_dec_seg": tempo_dec,
    }


def calcular_hidraulica_torrezan(
    vazao_ls: float,
    comp_floc: float,
    larg_floc: float,
    alt_floc: float,
    dec_por_floc: int,
    comp_dec: float,
    larg_dec: float,
    alt_dec: float,
) -> dict[str, Any]:
    """Calcula volumes e tempos de detenção para ETA Torrezan retangular."""
    vol_floc_unit = comp_floc * larg_floc * alt_floc
    vol_floc_total = vol_floc_unit

    vol_dec_unit = comp_dec * larg_dec * alt_dec
    vol_dec_total = vol_dec_unit * dec_por_floc

    tempo_floc = int((vol_floc_unit * 1000.0) / vazao_ls) if vazao_ls > 0 else 0
    vazao_por_dec = (vazao_ls / dec_por_floc) if dec_por_floc > 0 else vazao_ls
    tempo_dec = int((vol_dec_unit * 1000.0) / vazao_por_dec) if vazao_por_dec > 0 else 0

    return {
        "vol_floc_unit_m3": round(vol_floc_unit, 4),
        "vol_floc_total_m3": round(vol_floc_total, 4),
        "vol_dec_unit_m3": round(vol_dec_unit, 4),
        "vol_dec_total_m3": round(vol_dec_total, 4),
        "tempo_floc_seg": tempo_floc,
        "tempo_dec_seg": tempo_dec,
    }


def calcular_diluicoes_jarro_2l(dosagem_ml_min: float, vazao_ls: float) -> dict[str, float]:
    """
    Calcula os volumes em mL a pipetar em um jarro de 2L:
    - c100: Produto comercial puro (100%)
    - c10: Solução de trabalho a 10%
    - c1: Solução de trabalho a 1%
    """
    if vazao_ls <= 0:
        return {"c100": 0.0, "c10": 0.0, "c1": 0.0}

    vazao_l_min = vazao_ls * 60.0
    c100 = (dosagem_ml_min / vazao_l_min) * 2.0
    c10 = c100 * 10.0
    c1 = c100 * 100.0

    return {
        "c100": round(c100, 4),
        "c10": round(c10, 3),
        "c1": round(c1, 2),
    }


def ppm_para_ml_min(ppm: float, vazao_ls: float, conc_perc: float, densidade: float) -> float:
    """
    Converte dose em ppm (mg/L de ativo) para vazão da bomba em mL/min de produto comercial.

    ppm (mg/L) x Q (L/s) x 60 = mg/min de ativo.
    1 mL de produto contém (conc_frac x densidade g/mL x 1000) mg de ativo.
    => mL/min = ppm x Q x 0.06 / (conc_frac x densidade)
    """
    if vazao_ls <= 0 or conc_perc <= 0 or densidade <= 0 or ppm < 0:
        return 0.0
    return round((ppm * vazao_ls * 0.06) / ((conc_perc / 100.0) * densidade), 4)


def ml_min_para_ppm(ml_min: float, vazao_ls: float, conc_perc: float, densidade: float) -> float:
    """Conversão inversa: mL/min de produto comercial para ppm (mg/L de ativo)."""
    if vazao_ls <= 0 or conc_perc <= 0 or densidade <= 0 or ml_min < 0:
        return 0.0
    return round((ml_min * (conc_perc / 100.0) * densidade) / (vazao_ls * 0.06), 4)


def calcular_diluicoes_jarro_2l_ppm(ppm: float, conc_perc: float, densidade: float) -> dict[str, float]:
    """
    Volumes em mL de produto comercial a pipetar num jarro de 2 L
    a partir da dose em ppm (mg de ativo na água do jarro = ppm x 2 L).
    """
    if conc_perc <= 0 or densidade <= 0 or ppm < 0:
        return {"c100": 0.0, "c10": 0.0, "c1": 0.0}
    c100 = (ppm * 2.0) / ((conc_perc / 100.0) * densidade * 1000.0)
    return {
        "c100": round(c100, 4),
        "c10": round(c100 * 10.0, 3),
        "c1": round(c100 * 100.0, 2),
    }


def ppm_jarro_para_ml(ppm: float, conc_perc: float, densidade: float) -> float:
    """Dose de um jarro (2 L) em ppm -> mL de produto comercial."""
    if conc_perc <= 0 or densidade <= 0 or ppm is None or ppm < 0:
        return 0.0
    return round((ppm * 2.0) / ((conc_perc / 100.0) * densidade * 1000.0), 4)


def ml_jarro_para_ppm(ml: float, conc_perc: float, densidade: float) -> float:
    """Dose de um jarro (2 L) em mL de produto comercial -> ppm."""
    if conc_perc <= 0 or densidade <= 0 or ml is None or ml < 0:
        return 0.0
    return round((ml * (conc_perc / 100.0) * densidade * 1000.0) / 2.0, 4)


def avaliar_jarro(
    turbidez_bruta: float,
    cor_bruta: float,
    turbidez_final: float,
    cor_final: float,
    ph_final: float,
    cloro_final: float,
    fluor_final: float,
) -> dict[str, Any]:
    """Calcula percentual de remoção e verifica se cumpre a Portaria GM/MS 888/2021."""
    rem_turb = 0.0
    if turbidez_bruta > 0:
        rem_turb = max(0.0, ((turbidez_bruta - turbidez_final) / turbidez_bruta) * 100.0)

    rem_cor = 0.0
    if cor_bruta > 0:
        rem_cor = max(0.0, ((cor_bruta - cor_final) / cor_bruta) * 100.0)

    # Padrão de potabilidade para água tratada/clarificada
    # Cor <= 15 uH, Turbidez <= 0.5 a 2.0 NTU (decantada), pH entre 6.0 e 9.0
    atende = (
        cor_final <= 15.0
        and turbidez_final <= 2.0
        and 6.0 <= ph_final <= 9.0
    )

    return {
        "remocao_turbidez_perc": round(rem_turb, 2),
        "remocao_cor_perc": round(rem_cor, 2),
        "atende_potabilidade": atende,
    }
