# -*- coding: utf-8 -*-
"""Planos e limite do plano grátis (janela deslizante de 7 dias)."""
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _consistente(valor: datetime | None) -> datetime | None:
    """Garante datetime timezone-aware para comparações (sqlite retorna naive)."""
    if valor is None or valor.tzinfo is not None:
        return valor
    return valor.replace(tzinfo=timezone.utc)


def eh_admin(user: User) -> bool:
    return user.role == "admin"


def usuario_premium(user: User) -> bool:
    """True quando o plano pago está vigente ou o admin liberou 'sempre' (admin isento)."""
    if eh_admin(user) or user.plano_sempre:
        return True
    limite = _consistente(user.plano_ate)
    return limite is not None and limite > _utcnow()


def obter_plano(tipo: str) -> dict:
    """Catálogo de planos configurável no .env."""
    tabela = {
        "mensal": (settings.PLANO_MENSAL_PRECO, settings.PLANO_MENSAL_DIAS),
        "trimestral": (settings.PLANO_TRIMESTRAL_PRECO, settings.PLANO_TRIMESTRAL_DIAS),
        "anual": (settings.PLANO_ANUAL_PRECO, settings.PLANO_ANUAL_DIAS),
    }
    if tipo not in tabela:
        raise ValueError(f"Tipo de plano inválido: {tipo}")
    preco, dias = tabela[tipo]
    return {"tipo": tipo, "preco": preco, "dias": dias}


def catalogo_planos() -> list[dict]:
    return [obter_plano(t) for t in ("mensal", "trimestral", "anual")]


def usos_na_janela(user: User) -> int:
    """Quantidade de ensaios usados dentro da janela grátis."""
    if eh_admin(user) or usuario_premium(user):
        return 0
    usados = user.ensaios_usados or 0
    if usados == 0:
        return 0
    inicio = _consistente(user.janela_inicio)
    if inicio is None or inicio + timedelta(days=settings.JANELA_GRATIS_DIAS) <= _utcnow():
        return 0
    return usados


def registrar_uso(user: User) -> None:
    """Registra um ensaio do usuário grátis (reseta janela expirada)."""
    agora = _utcnow()
    inicio = _consistente(user.janela_inicio)
    if (
        user.ensaios_usados is not None
        and user.ensaios_usados > 0
        and inicio is not None
        and inicio + timedelta(days=settings.JANELA_GRATIS_DIAS) > agora
    ):
        user.ensaios_usados = (user.ensaios_usados or 0) + 1
        return
    # Janela expirada (ou primeira execução): reinicia contador.
    user.janela_inicio = agora
    user.ensaios_usados = 1


def estender_plano(user: User, tipo: str) -> datetime:
    """Estende plano_ate em max(hoje, atual) + duração (regra de extensão)."""
    plano = obter_plano(tipo)
    agora = _utcnow()
    atual = _consistente(user.plano_ate)
    base = atual if (atual and atual > agora) else agora
    novo = base + timedelta(days=plano["dias"])
    user.plano_ate = novo
    return novo
