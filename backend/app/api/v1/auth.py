import os
from datetime import datetime, timezone
from pathlib import Path

import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, PlainTextResponse
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
    encrypt_cpf,
    format_cpf,
    get_current_user,
    hash_cpf_for_uniqueness,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AceitarContratoRequest,
    LoginRequest,
    MensagemResponse,
    PerfilUpdate,
    RefreshRequest,
    RegisterRequest,
    ResendVerificationRequest,
    TokenResponse,
    UserOut,
    VerifyEmailRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_to_out(user: User) -> UserOut:
    """Constrói UserOut mascarando o CPF (decifra de cpf_cifrado; unicidade usa cpf_hash)."""
    masked = None
    if user.cpf_cifrado:
        try:
            from app.core.security import decrypt_cpf
            d = decrypt_cpf(user.cpf_cifrado)
            masked = f"•••.{d[3:6]}.{d[6:9]}-{d[9:]}"
        except Exception:
            masked = None
    return UserOut(
        id=user.id,
        nome=user.nome,
        sobrenome=user.sobrenome,
        email=user.email,
        telefone=user.telefone,
        cpf_masked=masked,
        role=user.role,
        ativo=user.ativo,
        email_verificado=user.email_verificado,
        perfil_completo=user.perfil_completo,
        criado_em=user.criado_em,
        plano_ate=user.plano_ate,
        plano_sempre=user.plano_sempre,
        pago=user.pago,
        empresa=user.empresa,
        formacao=user.formacao,
        cargo=user.cargo,
        logradouro=user.logradouro,
        numero=user.numero,
        complemento=user.complemento,
        bairro=user.bairro,
        cidade=user.cidade,
        uf=user.uf,
        cep=user.cep,
    )


def _token_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user=_user_to_out(user),
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
    return _user_to_out(user)


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


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return _user_to_out(current_user)


@router.put("/me/perfil", response_model=UserOut)
def atualizar_perfil(
    payload: PerfilUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Completa/atualiza perfil do usuário. Obrigatórios: nome, sobrenome, email, cpf."""

    # Verifica unicidade de email (se mudou)
    if payload.email.lower() != current_user.email:
        conflict = db.scalar(
            select(User).where(func.lower(User.email) == payload.email.lower())
        )
        if conflict and conflict.id != current_user.id:
            raise HTTPException(status_code=400, detail="E-mail já utilizado por outro usuário")

    # Verifica unicidade de CPF pelo hash determinístico (Fernet não serve: IV aleatório)
    novo_hash = hash_cpf_for_uniqueness(payload.cpf)
    if novo_hash != current_user.cpf_hash:
        conflict = db.scalar(select(User).where(User.cpf_hash == novo_hash))
        if conflict and conflict.id != current_user.id:
            raise HTTPException(status_code=400, detail="CPF já cadastrado por outro usuário")

    current_user.nome = payload.nome
    current_user.sobrenome = payload.sobrenome
    current_user.email = payload.email.lower()
    current_user.cpf_hash = novo_hash
    current_user.cpf_cifrado = encrypt_cpf(payload.cpf)
    current_user.telefone = payload.telefone
    current_user.empresa = payload.empresa
    current_user.formacao = payload.formacao
    current_user.cargo = payload.cargo
    current_user.logradouro = payload.logradouro
    current_user.numero = payload.numero
    current_user.complemento = payload.complemento
    current_user.bairro = payload.bairro
    current_user.cidade = payload.cidade
    current_user.uf = payload.uf
    current_user.cep = payload.cep
    current_user.perfil_completo = True

    db.commit()
    db.refresh(current_user)
    return _user_to_out(current_user)


@router.post("/me/contrato", response_model=MensagemResponse)
def aceitar_contrato(
    payload: AceitarContratoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registra aceite do contrato pelo usuário."""
    if not payload.aceito:
        raise HTTPException(status_code=400, detail="É necessário aceitar o contrato")
    current_user.contrato_aceito_em = datetime.now(timezone.utc)
    db.commit()
    return MensagemResponse(mensagem="Contrato aceito e registrado")


_CONTRATO_PATH = Path(__file__).resolve().parents[4] / "Contrato_saas.txt"


@router.get("/contrato")
def obter_contrato(current_user: User = Depends(get_current_user)):
    """Retorna o contrato como texto (uso autenticado)."""
    if not _CONTRATO_PATH.exists():
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    return PlainTextResponse(
        _CONTRATO_PATH.read_text(encoding="utf-8"),
        media_type="text/plain; charset=utf-8",
    )
