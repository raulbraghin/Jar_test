"""expandir tabela jt_users com perfil, cpf criptografado e endereco

Revision ID: 0001_expand_user_profile
Revises:
Create Date: 2026-09-06 12:00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001_expand_user_profile"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("jt_users", sa.Column("sobrenome", sa.String(length=255), nullable=True))
    op.add_column("jt_users", sa.Column("cpf_hash", sa.String(length=64), nullable=True))
    op.create_index("ix_jt_users_cpf_hash", "jt_users", ["cpf_hash"], unique=True)
    op.add_column("jt_users", sa.Column("cpf_cifrado", sa.String(length=512), nullable=True))
    op.add_column("jt_users", sa.Column("telefone", sa.String(length=20), nullable=True))

    op.add_column("jt_users", sa.Column("empresa", sa.String(length=255), nullable=True))
    op.add_column("jt_users", sa.Column("formacao", sa.String(length=255), nullable=True))
    op.add_column("jt_users", sa.Column("cargo", sa.String(length=255), nullable=True))

    op.add_column("jt_users", sa.Column("logradouro", sa.String(length=255), nullable=True))
    op.add_column("jt_users", sa.Column("numero", sa.String(length=20), nullable=True))
    op.add_column("jt_users", sa.Column("complemento", sa.String(length=255), nullable=True))
    op.add_column("jt_users", sa.Column("bairro", sa.String(length=255), nullable=True))
    op.add_column("jt_users", sa.Column("cidade", sa.String(length=255), nullable=True))
    op.add_column("jt_users", sa.Column("uf", sa.String(length=2), nullable=True))
    op.add_column("jt_users", sa.Column("cep", sa.String(length=10), nullable=True))

    op.add_column(
        "jt_users",
        sa.Column(
            "perfil_completo",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "jt_users",
        sa.Column("contrato_aceito_em", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("jt_users", "contrato_aceito_em")
    op.drop_column("jt_users", "perfil_completo")
    op.drop_column("jt_users", "cep")
    op.drop_column("jt_users", "uf")
    op.drop_column("jt_users", "cidade")
    op.drop_column("jt_users", "bairro")
    op.drop_column("jt_users", "complemento")
    op.drop_column("jt_users", "numero")
    op.drop_column("jt_users", "logradouro")
    op.drop_column("jt_users", "cargo")
    op.drop_column("jt_users", "formacao")
    op.drop_column("jt_users", "empresa")
    op.drop_column("jt_users", "telefone")
    op.drop_index("ix_jt_users_cpf_hash", table_name="jt_users")
    op.drop_column("jt_users", "cpf_cifrado")
    op.drop_column("jt_users", "cpf_hash")
    op.drop_column("jt_users", "sobrenome")
