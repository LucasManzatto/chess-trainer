"""add analyze_status and analyze_progress columns to games

Revision ID: a1b2c3d4e5f6
Revises: f4a8c1d9e3b2
Create Date: 2026-07-05

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f4a8c1d9e3b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('games', sa.Column('analyze_status', sa.String(16), nullable=False, server_default='idle'))
    op.add_column('games', sa.Column('analyze_progress', postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column('games', 'analyze_progress')
    op.drop_column('games', 'analyze_status')
