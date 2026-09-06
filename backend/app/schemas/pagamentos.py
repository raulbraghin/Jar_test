from typing import Literal

from pydantic import BaseModel, EmailStr

TipoPlano = Literal["mensal", "trimestral", "anual"]
ModoConcessao = Literal["teste30", "sempre", "revogar"]


class CheckoutRequest(BaseModel):
    tipo: TipoPlano


class SimularRequest(BaseModel):
    """Ativação manual (admin, teste sem MercadoPago) do plano de um usuário."""

    tipo: TipoPlano
    usuario_email: EmailStr | None = None


class ConcederRequest(BaseModel):
    """Concessão feita pelo admin a um usuário.

    modo:
      - teste30 -> plano pago por 30 dias (contando da data atual);
      - sempre  -> liberação permanente (independente de pagamento);
      - revogar -> remove a liberação permanente e o plano_até.
    """

    modo: ModoConcessao
    usuario_email: EmailStr | None = None


class CheckoutResponse(BaseModel):
    preferencia_id: str
    init_point: str


class PlanoDisponivel(BaseModel):
    tipo: str
    preco: float
    dias: int


class UsoResponse(BaseModel):
    role: str
    configurado: bool
    pago: bool
    plano_ate: str | None = None
    usados: int
    limite: int
    janela_dias: int
    liberado: bool
    planos: list[PlanoDisponivel]
