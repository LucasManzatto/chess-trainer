"""add comment column to position_annotations_arrows and position_annotations_circles

Revision ID: f4a8c1d9e3b2
Revises: e3f4a7b6c210
Create Date: 2026-07-02

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'f4a8c1d9e3b2'
down_revision: Union[str, None] = 'e3f4a7b6c210'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('position_annotations_arrows', sa.Column('comment', sa.Text(), nullable=True))
    op.add_column('position_annotations_circles', sa.Column('comment', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('position_annotations_circles', 'comment')
    op.drop_column('position_annotations_arrows', 'comment')
