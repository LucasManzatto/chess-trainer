"""idx_position_moves_from_position_id

Revision ID: a3c9f2b81d44
Revises: 1f71880a707e
Create Date: 2026-06-20

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'a3c9f2b81d44'
down_revision: Union[str, None] = '1f71880a707e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('ix_position_moves_from_position_id', 'position_moves', ['from_position_id'])


def downgrade() -> None:
    op.drop_index('ix_position_moves_from_position_id', table_name='position_moves')
