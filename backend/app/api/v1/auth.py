import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.mail import enviar_verificacao_email
from app.core.security import (
    create_access_token,
    create_email_verification_token,
    create_refresh_token,
    decode_email_verification_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    MensagemResponse,
    RefreshRequest,
    RegisterRequest,
    ResendVerificationRequest,
    TokenResponse,
    UserOut,
    VerifyEmailRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user=UserOut.model_validate(user),
    )


def _link_verificacao(email: str) -> str:
    token = create_email_verification_token(email)
    return f"{settings.FRONTEND_URL}/verificar-email?token={token}"


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    user = User(
        nome=payload.nome,
        email=payload.email.lower(),
        senha_hash=hash_password(payload.senha),
        role="engenheiro",
        email_verificado=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    enviar_verificacao_email(user.email, _link_verificacao(user.email))
    return user


@router.post("/verify-email", response_model=MensagemResponse)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    try:
        email = decode_email_verification_token(payload.token)
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Link de verificação inválido ou expirado")

    user = db.scalar(select(User).where(func.lower(User.email) == email.lower()))
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    user.email_verificado = True
    db.commit()
    return MensagemResponse(mensagem="E-mail verificado com sucesso! Você já pode fazer login.")


@router.post("/resend-verification", response_model=MensagemResponse)
def resend_verification(payload: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if not user or user.email_verificado:
        return MensagemResponse(mensagem="E-mail não encontrado ou já verificado")

    enviar_verificacao_email(user.email, _link_verificacao(user.email))
    return MensagemResponse(mensagem="Link de verificação reenviado com sucesso")


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if not user or not verify_password(payload.senha, user.senha_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")

    if not user.ativo:
        raise HTTPException(status_code=403, detail="Usuário inativo")

    if not user.email_verificado:
        enviar_verificacao_email(user.email, _link_verificacao(user.email))
        raise HTTPException(
            status_code=403,
            detail="E-mail não verificado. Enviamos um novo link de confirmação para a sua caixa de entrada.",
        )

    return _token_response(user)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        data = decode_token(payload.refresh_token)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Refresh token inválido ou expirado")

    if data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Tipo de token inválido")

    user = db.get(User, data.get("sub"))
    if not user or not user.ativo:
        raise HTTPException(status_code=401, detail="Usuário inválido ou inativo")

    return _token_response(user)
