"""add category column to position_annotations_arrows and position_annotations_circles

Revision ID: c1a2b3d4e5f6
Revises: afb16ad02ae8
Create Date: 2026-08-06

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'c1a2b3d4e5f6'
down_revision: Union[str, None] = 'afb16ad02ae8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CATEGORIES = ("best_move", "attacker", "defender", "target", "threat", "idea")


def upgrade() -> None:
    op.add_column('position_annotations_arrows', sa.Column('category', sa.Text(), nullable=True))
    op.add_column('position_annotations_circles', sa.Column('category', sa.Text(), nullable=True))
    op.create_check_constraint(
        'ck_position_annotations_arrows_category',
        'position_annotations_arrows',
        sa.text("category IS NULL OR category IN ('" + "', '".join(CATEGORIES) + "')"),
    )
    op.create_check_constraint(
        'ck_position_annotations_circles_category',
        'position_annotations_circles',
        sa.text("category IS NULL OR category IN ('" + "', '".join(CATEGORIES) + "')"),
    )


def downgrade() -> None:
    op.drop_constraint(
        'ck_position_annotations_circles_category', 'position_annotations_circles', type_='check'
    )
    op.drop_constraint(
        'ck_position_annotations_arrows_category', 'position_annotations_arrows', type_='check'
    )
    op.drop_column('position_annotations_circles', 'category')
    op.drop_column('position_annotations_arrows', 'category')
