import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.security import cpf_digits


def _validate_cpf(value: str) -> str:
    """Validação simples de CPF: 11 dígitos e DV."""
    d = cpf_digits(value)
    if len(d) != 11:
        raise ValueError("CPF deve conter 11 dígitos")
    if d == d[0] * 11:
        raise ValueError("CPF inválido")

    def calc(slice_: str, factor: int) -> int:
        total = sum(int(d) * f for d, f in zip(slice_, range(factor, 1, -1)))
        rest = (total * 10) % 11
        return 0 if rest == 10 else rest

    if calc(d[:9], 10) != int(d[9]) or calc(d[:10], 11) != int(d[10]):
        raise ValueError("CPF inválido")
    return d


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class RefreshRequest(BaseModel):
    refresh_token: str


class RegisterRequest(BaseModel):
    nome: str = Field(min_length=2, max_length=255)
    email: EmailStr
    senha: str = Field(min_length=6, max_length=128)


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nome: str
    sobrenome: str | None = None
    email: EmailStr
    telefone: str | None = None
    cpf_masked: str | None = None
    role: str
    ativo: bool
    email_verificado: bool
    perfil_completo: bool = False
    criado_em: datetime
    plano_ate: datetime | None = None
    plano_sempre: bool = False
    pago: bool = False

    empresa: str | None = None
    formacao: str | None = None
    cargo: str | None = None
    logradouro: str | None = None
    numero: str | None = None
    complemento: str | None = None
    bairro: str | None = None
    cidade: str | None = None
    uf: str | None = None
    cep: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class MensagemResponse(BaseModel):
    mensagem: str


class PerfilUpdate(BaseModel):
    """Payload para completar/atualizar perfil do usuário."""
    nome: str = Field(min_length=2, max_length=255)
    sobrenome: str = Field(min_length=2, max_length=255)
    email: EmailStr
    cpf: str = Field(min_length=11, max_length=14)

    # Opcionais
    telefone: str | None = None
    empresa: str | None = None
    formacao: str | None = None
    cargo: str | None = None
    logradouro: str | None = None
    numero: str | None = None
    complemento: str | None = None
    bairro: str | None = None
    cidade: str | None = None
    uf: str | None = Field(default=None, max_length=2)
    cep: str | None = None

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, v: str) -> str:
        return _validate_cpf(v)

    @field_validator("uf")
    @classmethod
    def validar_uf(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.upper().strip()
        if not re.match(r"^[A-Z]{2}$", v):
            raise ValueError("UF deve conter 2 letras")
        return v


class AceitarContratoRequest(BaseModel):
    aceito: bool = True
