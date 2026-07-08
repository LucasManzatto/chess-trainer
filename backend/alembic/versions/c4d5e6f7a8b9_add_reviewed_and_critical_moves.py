"""add reviewed and critical_moves columns to games

Revision ID: c4d5e6f7a8b9
Revises: a1b2c3d4e5f6
Create Date: 2026-07-08

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('games', sa.Column('reviewed', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('games', sa.Column('critical_moves', sa.ARRAY(sa.Integer()), nullable=True))


def downgrade() -> None:
    op.drop_column('games', 'critical_moves')
    op.drop_column('games', 'reviewed')
