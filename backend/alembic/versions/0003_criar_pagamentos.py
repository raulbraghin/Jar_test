"""criar tabela jt_pagamentos (auditoria de pagamentos Mercado Pago)

Revision ID: 0003_criar_pagamentos
Revises: 0002_unidade_ppm
Create Date: 2026-09-06 15:00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0003_criar_pagamentos"
down_revision = "0002_unidade_ppm"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "jt_pagamentos",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("mp_payment_id", sa.String(length=64), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("valor", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("aprovado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["jt_users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_jt_pagamentos_mp_payment_id", "jt_pagamentos", ["mp_payment_id"], unique=True)
    op.create_index("ix_jt_pagamentos_user_id", "jt_pagamentos", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_jt_pagamentos_user_id", table_name="jt_pagamentos")
    op.drop_index("ix_jt_pagamentos_mp_payment_id", table_name="jt_pagamentos")
    op.drop_table("jt_pagamentos")
