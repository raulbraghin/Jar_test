import base64
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt
from cryptography.fernet import Fernet, InvalidToken
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, senha_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), senha_hash.encode("utf-8"))


def _cpf_fernet() -> Fernet:
    """Retorna instância Fernet. Se CPF_KEY vazia, deriva de SECRET_KEY."""
    key = settings.CPF_KEY
    if not key:
        derived = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
        key = base64.urlsafe_b64encode(derived).decode("utf-8")
    return Fernet(key.encode("utf-8"))


def cpf_digits(cpf: str) -> str:
    """Mantém apenas dígitos do CPF."""
    return "".join(ch for ch in cpf if ch.isdigit())


def encrypt_cpf(cpf: str) -> str:
    """Cifra CPF (apenas dígitos) com Fernet. Retorna token base64."""
    return _cpf_fernet().encrypt(cpf_digits(cpf).encode("utf-8")).decode("utf-8")


def decrypt_cpf(token: str) -> str:
    """Decifra o token Fernet do CPF. Lança InvalidToken se inválido."""
    return _cpf_fernet().decrypt(token.encode("utf-8")).decode("utf-8")


def hash_cpf_for_uniqueness(cpf: str) -> str:
    """Hash determinístico (sha256) do CPF normalizado — usado para unicidade."""
    return hashlib.sha256(cpf_digits(cpf).encode("utf-8")).hexdigest()


def format_cpf(cpf: str) -> str:
    """Formata CPF como 000.000.000-00."""
    d = cpf_digits(cpf)
    if len(d) != 11:
        return cpf
    return f"{d[:3]}.{d[3:6]}.{d[6:9]}-{d[9:]}"


def _create_token(subject: str, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: str) -> str:
    return _create_token(subject, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES), "access")


def create_refresh_token(subject: str) -> str:
    return _create_token(subject, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS), "refresh")


def create_email_verification_token(email: str) -> str:
    return _create_token(
        email, timedelta(hours=settings.EMAIL_TOKEN_EXPIRE_HOURS), "email_verificacao"
    )


def decode_email_verification_token(token: str) -> str:
    payload = decode_token(token)
    if payload.get("type") != "email_verificacao" or not payload.get("sub"):
        raise jwt.PyJWTError("token de verificação inválido")
    return payload["sub"]


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    from app.models.user import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
    except jwt.PyJWTError:
        raise credentials_exception
    user_id = payload.get("sub")
    if not user_id:
        raise credentials_exception
    user = db.get(User, uuid.UUID(user_id))
    if not user or not user.ativo:
        raise credentials_exception
    return user


def require_role(*roles: str):
    def dependency(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão negada")
        return current_user

    return dependency
