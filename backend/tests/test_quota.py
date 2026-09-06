from datetime import datetime, timedelta, timezone

from app.core.config import settings
from tests.utils import auth_headers, criar_usuario, login


def _ensaio_payload():
    return {
        "agua_bruta": {
            "cor_aparente": 15,
            "turbidez": 8.5,
            "ph": 7.2,
            "condutividade": 90,
            "alcalinidade": 40,
        },
        "jarros": [
            {
                "numero_jarro": 1,
                "dose_pac_ml": 0.6,
                "cor_aparente": 2,
                "turbidez": 1.2,
                "ph": 6.9,
                "cloro_residual": 0.5,
                "fluor": 0.1,
                "condutividade": 85,
                "jarro_otimo": True,
            }
        ],
    }


def _criar_projeto(client, headers):
    resp = client.post(
        "/api/v1/projetos/",
        json={"nome_projeto": "Ensaio Quota", "cliente": "Teste"},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()["id"]


def _salvar_ensaio(client, headers, pid):
    return client.post(
        f"/api/v1/projetos/{pid}/ensaio/completo",
        json=_ensaio_payload(),
        headers=headers,
    )


def _user_free(db_session, email="eng@jar.com"):
    return criar_usuario(db_session, nome="Engenheira", email=email, role="engenheiro")


def test_free_atinge_limite(client, db_session):
    _user_free(db_session)
    tokens = login(client, email="eng@jar.com")
    headers = auth_headers(tokens)
    pid = _criar_projeto(client, headers)

    limite = settings.LIMITE_GRATIS_ENSAIOS
    for _ in range(limite):
        resp = _salvar_ensaio(client, headers, pid)
        assert resp.status_code == 200

    resp = _salvar_ensaio(client, headers, pid)
    assert resp.status_code == 402
    assert resp.json()["detail"]["code"] == "LIMITE_ATINGIDO"


def test_uso_reflete_contador(client, db_session):
    _user_free(db_session)
    tokens = login(client, email="eng@jar.com")
    headers = auth_headers(tokens)
    pid = _criar_projeto(client, headers)

    resp = client.get("/api/v1/pagamentos/uso", headers=headers)
    assert resp.json()["usados"] == 0
    assert resp.json()["liberado"] is True

    _salvar_ensaio(client, headers, pid)
    resp = client.get("/api/v1/pagamentos/uso", headers=headers)
    assert resp.json()["usados"] == 1
    assert resp.json()["liberado"] is True

    for _ in range(settings.LIMITE_GRATIS_ENSAIOS - 1):
        _salvar_ensaio(client, headers, pid)
    resp = client.get("/api/v1/pagamentos/uso", headers=headers)
    assert resp.json()["usados"] == settings.LIMITE_GRATIS_ENSAIOS
    assert resp.json()["liberado"] is False


def test_janela_expirada_reseta(client, db_session):
    user = _user_free(db_session)
    user.ensaios_usados = 1
    user.janela_inicio = datetime.now(timezone.utc) - timedelta(days=8)
    db_session.commit()

    tokens = login(client, email="eng@jar.com")
    headers = auth_headers(tokens)
    pid = _criar_projeto(client, headers)

    resp = _salvar_ensaio(client, headers, pid)
    assert resp.status_code == 200
    db_session.refresh(user)
    assert user.ensaios_usados == 1


def test_premium_tem_ensaios_ilimitados(client, db_session):
    user = _user_free(db_session)
    user.plano_ate = datetime.now(timezone.utc) + timedelta(days=30)
    db_session.commit()

    tokens = login(client, email="eng@jar.com")
    headers = auth_headers(tokens)
    pid = _criar_projeto(client, headers)

    for _ in range(settings.LIMITE_GRATIS_ENSAIOS + 2):
        resp = _salvar_ensaio(client, headers, pid)
        assert resp.status_code == 200


def test_admin_e_isento_do_limite(client, db_session):
    criar_usuario(db_session, role="admin")
    tokens = login(client)
    headers = auth_headers(tokens)
    pid = _criar_projeto(client, headers)

    for _ in range(settings.LIMITE_GRATIS_ENSAIOS + 2):
        resp = _salvar_ensaio(client, headers, pid)
        assert resp.status_code == 200
