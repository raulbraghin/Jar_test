from app.core.security import hash_password


def criar_usuario(db, nome="Admin", email="admin@jar.com", senha="senha123", role="admin", email_verificado=True):
    from app.models.user import User

    user = User(
        nome=nome,
        email=email,
        senha_hash=hash_password(senha),
        role=role,
        email_verificado=email_verificado,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login(client, email="admin@jar.com", senha="senha123"):
    resp = client.post("/api/v1/auth/login", json={"email": email, "senha": senha})
    assert resp.status_code == 200, resp.text
    return resp.json()


def auth_headers(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}
