# -*- coding: utf-8 -*-
"""Integração com o MercadoPago (Checkout Pro) usando apenas `requests`.

Credenciais vêm do .env (MERCADOPAGO_ACCESS_TOKEN). Nada é exposto ao frontend.
O webhook sempre busca o pagamento na API do MercadoPago (fonte da verdade) —
o corpo do webhook nunca é confiado.
"""
from typing import Any

import requests

from app.core.config import settings
from app.services import planos


class MercadoPagoError(Exception):
    pass


def _token() -> str:
    token = settings.MERCADOPAGO_ACCESS_TOKEN.strip()
    if not token:
        raise MercadoPagoError("Pagamentos não configurados (MERCADOPAGO_ACCESS_TOKEN vazio)")
    return token


def _headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {_token()}"}


def criar_preferencia(tipo: str, user_id: str) -> dict[str, str]:
    """Cria preferência de Checkout Pro e devolve {id, init_point}."""
    plano = planos.obter_plano(tipo)
    url = f"{settings.MERCADOPAGO_API_BASE}/checkout/preferences"
    rotulo = {"mensal": "Mensal", "trimestral": "Trimestral", "anual": "Anual"}.get(tipo, tipo)
    base = settings.FRONTEND_URL.rstrip("/")
    payload = {
        "items": [
            {
                "title": f"Jar-Test Digital — Plano {rotulo}",
                "quantity": 1,
                "unit_price": float(plano["preco"]),
                "currency_id": "BRL",
            }
        ],
        "external_reference": f"jt:{user_id}:{tipo}",
        "auto_return": "approved",
        "back_urls": {
            "success": f"{base}/plano/status?status=success",
            "failure": f"{base}/plano/status?status=failure",
            "pending": f"{base}/plano/status?status=pending",
        },
    }
    try:
        resp = requests.post(url, json=payload, headers=_headers(), timeout=20)
        resp.raise_for_status()
    except MercadoPagoError:
        raise
    except requests.RequestException as e:
        raise MercadoPagoError(f"Falha ao criar preferência no MercadoPago: {e}") from e

    dados = resp.json()
    init_point = dados.get("init_point") or dados.get("sandbox_init_point")
    if not init_point or not dados.get("id"):
        raise MercadoPagoError("MercadoPago não retornou init_point para a preferência")
    return {"id": dados["id"], "init_point": init_point}


def obter_pagamento(payment_id: str) -> dict[str, Any]:
    """Busca o pagamento no MercadoPago (fonte da verdade)."""
    url = f"{settings.MERCADOPAGO_API_BASE}/v1/payments/{payment_id}"
    try:
        resp = requests.get(url, headers=_headers(), timeout=20)
        resp.raise_for_status()
        return resp.json()
    except MercadoPagoError:
        raise
    except requests.RequestException as e:
        raise MercadoPagoError(f"Falha ao consultar pagamento {payment_id}: {e}") from e
