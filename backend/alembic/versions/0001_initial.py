"""initial schema (baseline) — cria todas as tabelas a partir dos models

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-12

O projeto Jar_test não tinha migração inicial: as revisões 0001/0002/0003
faziam apenas ALTER/CREATE incremental sobre um schema base criado fora do
Alembic. Como o startup da API roda `alembic upgrade head`, um banco vazio
quebrava em `relation "jt_users" does not exist`.

Esta baseline consolida o schema atual dos models em uma única revisão, para
que `alembic upgrade head` funcione em um banco vazio. As revisões antigas
(0001_expand_user_profile, 0002_unidade_ppm, 0003_criar_pagamentos) foram
removidas.
"""
from alembic import op

from app import models  # noqa: F401  (registra todos os models no metadata)
from app.db.base import Base


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
