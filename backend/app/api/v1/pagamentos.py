# -*- coding: utf-8 -*-
"""Pagamentos MercadoPago: checkout, webhook IPN e uso/limite do plano."""
import hashlib
import hmac
import logging
import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_user, require_role
from app.db.session import get_db
from app.models.pagamento import Pagamento
from app.models.user import User
from app.schemas.pagamentos import (
    CheckoutRequest,
    CheckoutResponse,
    ConcederRequest,
    PlanoDisponivel,
    SimularRequest,
    UsoResponse,
)
from app.services import mercadopago, planos

logger = logging.getLogger("pagamentos")

router = APIRouter(prefix="/pagamentos", tags=["pagamentos"])

_PADRAO_EXT = re.compile(r"^jt:([0-9a-fA-F-]{36}):(mensal|trimestral|anual)$")


@router.post("/checkout", response_model=CheckoutResponse)
def checkout(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cria a preferência no MercadoPago e devolve o init_point para o frontend."""
    if not settings.MERCADOPAGO_ACCESS_TOKEN.strip():
        raise HTTPException(
            status_code=503,
            detail={
                "code": "PAGAMENTOS_NAO_CONFIGURADOS",
                "mensagem": "Pagamentos ainda não configurados. Tente novamente mais tarde.",
            },
        )
    try:
        pref = mercadopago.criar_preferencia(payload.tipo, str(current_user.id))
    except mercadopago.MercadoPagoError as e:
        logger.error("checkout: %s", e)
        raise HTTPException(
            status_code=502,
            detail={
                "code": "MERCADOPAGO_ERRO",
                "mensagem": "Não foi possível iniciar o pagamento. Tente novamente.",
            },
        )
    return CheckoutResponse(preferencia_id=pref["id"], init_point=pref["init_point"])


@router.post("/webhook")
async def webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Recebe notificação IPN do MercadoPago (evento 'payment').

    Nunca confia no corpo: busca o pagamento na API do MercadoPago usando
    data.id. Responde sempre 200 (o MercadoPago reenvia em caso de falha).
    """
    try:
        corpo = await request.json()
    except Exception:
        corpo = {}

    tipo = corpo.get("type") or corpo.get("action") or ""
    dados = corpo.get("data") if isinstance(corpo.get("data"), dict) else {}
    payment_id = str(
        dados.get("id")
        or corpo.get("data.id")
        or request.query_params.get("data.id")
        or request.query_params.get("id")
        or ""
    )

    if tipo != "payment" or not payment_id:
        return {"recebido": True}

    _validar_assinatura(request, payment_id)

    try:
        payment = mercadopago.obter_pagamento(payment_id)
    except mercadopago.MercadoPagoError as e:
        logger.warning("webhook: falha ao consultar pagamento %s: %s", payment_id, e)
        return {"recebido": True}

    status = str(payment.get("status") or "")
    external_ref = str(payment.get("external_reference") or "")

    if status == "approved":
        _processar_aprovado(db, payment_id, external_ref, payment)

    return {"recebido": True}


def _processar_aprovado(
    db: Session, payment_id: str, external_ref: str, payment: dict
) -> None:
    match = _PADRAO_EXT.match(external_ref)
    if not match:
        logger.warning("webhook: external_reference inválida: %s", external_ref)
        return
    user_id = match.group(1)
    tipo = match.group(2)
    try:
        user = db.get(User, uuid.UUID(user_id))
    except (ValueError, AttributeError):
        user = None
    if not user:
        logger.warning("webhook: usuário inexistente para payment %s", payment_id)
        return

    existente = db.scalar(
        select(Pagamento).where(Pagamento.mp_payment_id == payment_id)
    )
    if existente:
        # Idempotência: webhook duplicado não estende o plano duas vezes.
        return

    valor = payment.get("transaction_amount")
    registro = Pagamento(
        user_id=user.id,
        mp_payment_id=payment_id,
        tipo=tipo,
        valor=float(valor) if valor is not None else 0,
        status="approved",
        aprovado_em=datetime.now(timezone.utc),
    )
    db.add(registro)
    planos.estender_plano(user, tipo)
    db.commit()
    logger.info(
        "webhook: pagamento %s aprovado — usuário %s plano %s estendido até %s",
        payment_id, user.email, tipo, user.plano_ate,
    )


def _validar_assinatura(request: Request, payment_id: str) -> None:
    """Valida X-Signature do MercadoPago quando MERCADOPAGO_WEBHOOK_SECRET está setado.

    Formato do header: ts=...,v1=...  (assinatura sobre
    "id:<payment_id>;request-id:<x-request-id>;ts:<ts>;"). Se faltarem os campos
    não bloqueia a notificação (best-effort).
    """
    secret = settings.MERCADOPAGO_WEBHOOK_SECRET.strip()
    if not secret:
        return
    signature = request.headers.get("x-signature") or ""
    request_id = request.headers.get("x-request-id") or ""
    partes = {}
    for item in signature.split(","):
        if "=" in item:
            k, v = item.split("=", 1)
            partes[k.strip()] = v.strip()
    ts = partes.get("ts", "")
    v1 = partes.get("v1", "")
    if not ts or not v1 or not request_id:
        return
    mensagem = f"id:{payment_id};request-id:{request_id};ts:{ts};"
    esperado = hmac.new(secret.encode(), mensagem.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(esperado, v1):
        logger.warning("webhook: assinatura inválida para payment %s", payment_id)


@router.post("/simular-ativacao")
def simular_ativacao(
    payload: SimularRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """APENAS ADMIN — ativação manual do plano (teste sem MercadoPago).

    Estende users.plano_ate como se um pagamento 'approved' tivesse chegado.
    Serve para validar quota/plano localmente ou no sandbox sem webhook.
    """
    if payload.usuario_email:
        alvo = db.scalar(
            select(User).where(
                func.lower(User.email) == payload.usuario_email.lower()
            )
        )
        if not alvo:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
    else:
        alvo = current_user
    novo_ate = planos.estender_plano(alvo, payload.tipo)
    db.commit()
    return {
        "mensagem": f"Plano {payload.tipo} ativado (teste sem MercadoPago) para {alvo.email}.",
        "usuario": alvo.email,
        "plano_ate": novo_ate.isoformat(),
        "pago": planos.usuario_premium(alvo),
    }


@router.post("/admin/conceder")
def conceder_acesso(
    payload: ConcederRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """APENAS ADMIN — concede períodos de teste ou liberação permanente a um usuário.

    - modo 'teste30': libera por 30 dias (independente de MercadoPago);
    - modo 'sempre' : liberação permanente (não expira);
    - modo 'revogar': remove a liberação (volta ao plano grátis).
    """
    if payload.usuario_email:
        alvo = db.scalar(
            select(User).where(func.lower(User.email) == payload.usuario_email.lower())
        )
        if not alvo:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
    else:
        alvo = current_user

    if payload.modo == "teste30":
        alvo.plano_sempre = False
        novo_ate = planos.estender_plano(alvo, "mensal")
        mensagem = f"Plano teste de 30 dias concedido a {alvo.email}."
        resp_ate = novo_ate.isoformat()
    elif payload.modo == "sempre":
        alvo.plano_sempre = True
        alvo.plano_ate = None
        mensagem = f"Acesso permanente concedido a {alvo.email}."
        resp_ate = None
    else:  # revogar
        alvo.plano_sempre = False
        alvo.plano_ate = None
        mensagem = f"Liberação removida para {alvo.email} (voltou ao plano grátis)."
        resp_ate = None

    db.commit()
    return {
        "mensagem": mensagem,
        "usuario": alvo.email,
        "plano_sempre": alvo.plano_sempre,
        "plano_ate": resp_ate,
        "pago": planos.usuario_premium(alvo),
    }


@router.get("/uso", response_model=UsoResponse)
def uso(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Status do plano + uso na janela do plano grátis + catálogo de planos."""
    usados = planos.usos_na_janela(current_user)
    limite = settings.LIMITE_GRATIS_ENSAIOS
    premium = planos.usuario_premium(current_user)
    liberado = premium or usados < limite
    plano_ate = (
        current_user.plano_ate.isoformat()
        if current_user.plano_ate is not None
        else None
    )
    return UsoResponse(
        role=current_user.role,
        configurado=bool(settings.MERCADOPAGO_ACCESS_TOKEN.strip()),
        pago=premium,
        plano_ate=plano_ate,
        usados=usados,
        limite=limite,
        janela_dias=settings.JANELA_GRATIS_DIAS,
        liberado=liberado,
        planos=[PlanoDisponivel(**p) for p in planos.catalogo_planos()],
    )
