import pytest
from app.services.calculos import (
    avaliar_jarro,
    calcular_diluicoes_jarro_2l,
    calcular_hidraulica_modular,
    calcular_hidraulica_torrezan,
)


def test_calcular_hidraulica_modular():
    res = calcular_hidraulica_modular(
        vazao_ls=20.0,
        qtd_floc=2,
        dia_floc=2.0,
        alt_floc=2.5,
        qtd_dec=2,
        dia_dec=3.0,
        alt_dec=3.0,
    )
    assert res["vol_floc_unit_m3"] > 0
    assert res["vol_dec_unit_m3"] > 0
    assert res["tempo_floc_seg"] > 0
    assert res["tempo_dec_seg"] > 0


def test_calcular_hidraulica_torrezan():
    res = calcular_hidraulica_torrezan(
        vazao_ls=30.0,
        comp_floc=5.0,
        larg_floc=3.0,
        alt_floc=2.0,
        dec_por_floc=2,
        comp_dec=8.0,
        larg_dec=3.0,
        alt_dec=2.5,
    )
    assert res["vol_floc_unit_m3"] == 30.0
    assert res["vol_dec_unit_m3"] == 60.0
    assert res["tempo_floc_seg"] == 1000
    assert res["tempo_dec_seg"] == 4000


def test_calcular_diluicoes_jarro_2l():
    # Vazão = 10 L/s -> 600 L/min
    # Dosagem = 60 ml/min
    # Para 2L: (60 / 600) * 2 = 0.2000 mL
    # c10 = 2.000 mL
    # c1 = 20.00 mL
    res = calcular_diluicoes_jarro_2l(dosagem_ml_min=60.0, vazao_ls=10.0)
    assert res["c100"] == 0.2
    assert res["c10"] == 2.0
    assert res["c1"] == 20.0


def test_avaliar_jarro():
    res = avaliar_jarro(
        turbidez_bruta=50.0,
        cor_bruta=100.0,
        turbidez_final=1.5,
        cor_final=8.0,
        ph_final=7.2,
        cloro_final=1.2,
        fluor_final=0.8,
    )
    assert res["remocao_turbidez_perc"] == 97.0
    assert res["remocao_cor_perc"] == 92.0
    assert res["atende_potabilidade"] is True
