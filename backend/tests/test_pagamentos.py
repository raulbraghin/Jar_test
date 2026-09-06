from sqlalchemy import select

from app.models.pagamento import Pagamento
from app.models.user import User
from app.services import mercadopago
from tests.utils import auth_headers, criar_usuario, login


def _payment(payment_id="5000001", status="approved", external_reference=None, amount=49.9):
    return {
        "id": payment_id,
        "status": status,
        "transaction_amount": amount,
        "external_reference": external_reference,
    }


def _usuario_eng(db_session, email="pag@jar.com"):
    return criar_usuario(db_session, nome="Eng", email=email, role="engenheiro")


def test_checkout_sem_token_retorna_erro_controlado(client, db_session):
    _usuario_eng(db_session)
    tokens = login(client, email="pag@jar.com")
    resp = client.post(
        "/api/v1/pagamentos/checkout",
        json={"tipo": "mensal"},
        headers=auth_headers(tokens),
    )
    assert resp.status_code == 503
    assert resp.json()["detail"]["code"] == "PAGAMENTOS_NAO_CONFIGURADOS"


def test_uso_status_plano_gratis(client, db_session):
    _usuario_eng(db_session)
    tokens = login(client, email="pag@jar.com")
    resp = client.get("/api/v1/pagamentos/uso", headers=auth_headers(tokens))
    assert resp.status_code == 200
    body = resp.json()
    assert body["configurado"] is False
    assert body["pago"] is False
    assert body["usados"] == 0
    assert body["limite"] == 3
    assert body["liberado"] is True
    tipos = {p["tipo"] for p in body["planos"]}
    assert tipos == {"mensal", "trimestral", "anual"}
    precos = {p["tipo"]: p["preco"] for p in body["planos"]}
    assert precos["mensal"] == 4.99
    assert precos["trimestral"] == 14.99
    assert precos["anual"] == 49.99


def test_webhook_aprovado_estende_plano(client, db_session, monkeypatch):
    user = _usuario_eng(db_session)
    monkeypatch.setattr(
        mercadopago,
        "obter_pagamento",
        lambda payment_id: _payment("5000001", "approved", f"jt:{user.id}:mensal"),
    )
    resp = client.post(
        "/api/v1/pagamentos/webhook", json={"type": "payment", "data": {"id": "5000001"}}
    )
    assert resp.status_code == 200

    db_session.refresh(user)
    assert user.pago is True

    registro = db_session.scalar(
        select(Pagamento).where(Pagamento.mp_payment_id == "5000001")
    )
    assert registro is not None
    assert registro.tipo == "mensal"
    assert registro.status == "approved"


def test_webhook_duplicado_nao_estende_duas_vezes(client, db_session, monkeypatch):
    user = _usuario_eng(db_session)
    monkeypatch.setattr(
        mercadopago,
        "obter_pagamento",
        lambda payment_id: _payment("5000002", "approved", f"jt:{user.id}:anual"),
    )
    client.post(
        "/api/v1/pagamentos/webhook", json={"type": "payment", "data": {"id": "5000002"}}
    )
    db_session.refresh(user)
    primeiro = user.plano_ate

    client.post(
        "/api/v1/pagamentos/webhook", json={"type": "payment", "data": {"id": "5000002"}}
    )
    db_session.refresh(user)
    assert user.plano_ate == primeiro


def test_webhook_pendente_nao_estende(client, db_session, monkeypatch):
    user = _usuario_eng(db_session)
    monkeypatch.setattr(
        mercadopago,
        "obter_pagamento",
        lambda payment_id: _payment("5000003", "pending", f"jt:{user.id}:mensal"),
    )
    resp = client.post(
        "/api/v1/pagamentos/webhook", json={"type": "payment", "data": {"id": "5000003"}}
    )
    assert resp.status_code == 200
    db_session.refresh(user)
    assert user.pago is False


def test_webhook_external_reference_invalida_sem_efeito(client, db_session, monkeypatch):
    user = _usuario_eng(db_session)
    monkeypatch.setattr(
        mercadopago,
        "obter_pagamento",
        lambda payment_id: _payment("5000004", "approved", "outra-coisa"),
    )
    client.post(
        "/api/v1/pagamentos/webhook", json={"type": "payment", "data": {"id": "5000004"}}
    )
    db_session.refresh(user)
    assert user.pago is False
    registro = db_session.scalar(
        select(Pagamento).where(Pagamento.mp_payment_id == "5000004")
    )
    assert registro is None


def test_simular_ativacao_somente_admin(client, db_session):
    criar_usuario(db_session, role="admin")
    alvo = criar_usuario(db_session, nome="Eng Alvo", email="alvo@jar.com", role="engenheiro")
    tokens = login(client)
    headers = auth_headers(tokens)
    resp = client.post(
        "/api/v1/pagamentos/simular-ativacao",
        json={"tipo": "mensal", "usuario_email": "alvo@jar.com"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["pago"] is True
    assert resp.json()["plano_ate"]
    db_session.refresh(alvo)
    assert alvo.pago is True


def test_simular_ativacao_bloqueia_nao_admin(client, db_session):
    criar_usuario(db_session, nome="Eng", email="pag2@jar.com", role="engenheiro")
    tokens = login(client, email="pag2@jar.com")
    resp = client.post(
        "/api/v1/pagamentos/simular-ativacao",
        json={"tipo": "mensal"},
        headers=auth_headers(tokens),
    )
    assert resp.status_code == 403


def test_admin_concede_30_dias(client, db_session):
    criar_usuario(db_session, role="admin")
    alvo = criar_usuario(db_session, nome="Eng Alvo", email="alvo2@jar.com", role="engenheiro")
    tokens = login(client)
    resp = client.post(
        "/api/v1/pagamentos/admin/conceder",
        json={"modo": "teste30", "usuario_email": "alvo2@jar.com"},
        headers=auth_headers(tokens),
    )
    assert resp.status_code == 200
    assert resp.json()["pago"] is True
    assert resp.json()["plano_sempre"] is False
    assert resp.json()["plano_ate"]
    db_session.refresh(alvo)
    assert alvo.pago is True


def test_admin_concede_sempre(client, db_session):
    criar_usuario(db_session, role="admin")
    alvo = criar_usuario(db_session, nome="Eng Sempre", email="sempre@jar.com", role="engenheiro")
    tokens = login(client)
    resp = client.post(
        "/api/v1/pagamentos/admin/conceder",
        json={"modo": "sempre", "usuario_email": "sempre@jar.com"},
        headers=auth_headers(tokens),
    )
    assert resp.status_code == 200
    assert resp.json()["pago"] is True
    assert resp.json()["plano_sempre"] is True
    db_session.refresh(alvo)
    assert alvo.plano_sempre is True
    assert alvo.pago is True


def test_admin_revoga_concessao(client, db_session):
    criar_usuario(db_session, role="admin")
    alvo = criar_usuario(db_session, nome="Eng Revoga", email="revoga@jar.com", role="engenheiro")
    tokens = login(client)
    client.post(
        "/api/v1/pagamentos/admin/conceder",
        json={"modo": "sempre", "usuario_email": "revoga@jar.com"},
        headers=auth_headers(tokens),
    )
    resp = client.post(
        "/api/v1/pagamentos/admin/conceder",
        json={"modo": "revogar", "usuario_email": "revoga@jar.com"},
        headers=auth_headers(tokens),
    )
    assert resp.status_code == 200
    assert resp.json()["pago"] is False
    db_session.refresh(alvo)
    assert alvo.pago is False


def test_conceder_bloqueia_nao_admin(client, db_session):
    criar_usuario(db_session, nome="Eng", email="pag3@jar.com", role="engenheiro")
    tokens = login(client, email="pag3@jar.com")
    resp = client.post(
        "/api/v1/pagamentos/admin/conceder",
        json={"modo": "sempre", "usuario_email": "outro@jar.com"},
        headers=auth_headers(tokens),
    )
    assert resp.status_code == 403
