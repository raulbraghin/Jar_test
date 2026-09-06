"""adicionar unidade mL/min|ppm, conc/densidade e doses em ppm

Revision ID: 0002_unidade_ppm
Revises: 0001_expand_user_profile
Create Date: 2026-09-06 14:00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0002_unidade_ppm"
down_revision = "0001_expand_user_profile"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "jt_dosagens_planta",
        sa.Column("unidade", sa.String(length=10), nullable=False, server_default="ml_min"),
    )
    for col in ("dosagem_pac_ppm", "dosagem_hipo_ppm", "dosagem_alc_ppm", "dosagem_flu_ppm"):
        op.add_column(
            "jt_dosagens_planta",
            sa.Column(col, sa.Float(), nullable=False, server_default="0.0"),
        )
    for col in (
        "pac_conc_perc", "pac_densidade",
        "hipo_conc_perc", "hipo_densidade",
        "alc_conc_perc", "alc_densidade",
        "flu_conc_perc", "flu_densidade",
    ):
        op.add_column("jt_dosagens_planta", sa.Column(col, sa.Float(), nullable=True))

    for col in ("dose_pac_ppm", "dose_hipo_ppm", "dose_alc_ppm", "dose_flu_ppm"):
        op.add_column("jt_resultados_jarros", sa.Column(col, sa.Float(), nullable=True))


def downgrade() -> None:
    for col in ("dose_pac_ppm", "dose_hipo_ppm", "dose_alc_ppm", "dose_flu_ppm"):
        op.drop_column("jt_resultados_jarros", col)
    for col in (
        "pac_conc_perc", "pac_densidade",
        "hipo_conc_perc", "hipo_densidade",
        "alc_conc_perc", "alc_densidade",
        "flu_conc_perc", "flu_densidade",
    ):
        op.drop_column("jt_dosagens_planta", col)
    for col in ("dosagem_pac_ppm", "dosagem_hipo_ppm", "dosagem_alc_ppm", "dosagem_flu_ppm"):
        op.drop_column("jt_dosagens_planta", col)
    op.drop_column("jt_dosagens_planta", "unidade")
