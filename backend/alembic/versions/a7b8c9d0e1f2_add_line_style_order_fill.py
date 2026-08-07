"""add line_style/order to arrows and line_style/fill to circles

Revision ID: a7b8c9d0e1f2
Revises: c1a2b3d4e5f6
Create Date: 2026-08-07

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, None] = 'c1a2b3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LINE_STYLES = ("solid", "dashed", "dotted")


def upgrade() -> None:
    op.add_column(
        'position_annotations_arrows',
        sa.Column('line_style', sa.Text(), nullable=False, server_default='solid'),
    )
    op.add_column('position_annotations_arrows', sa.Column('order', sa.Integer(), nullable=True))
    op.create_check_constraint(
        'ck_position_annotations_arrows_line_style',
        'position_annotations_arrows',
        sa.text("line_style IN ('" + "', '".join(LINE_STYLES) + "')"),
    )

    op.add_column(
        'position_annotations_circles',
        sa.Column('line_style', sa.Text(), nullable=False, server_default='solid'),
    )
    op.add_column(
        'position_annotations_circles',
        sa.Column('fill', sa.Boolean(), nullable=False, server_default='false'),
    )
    op.create_check_constraint(
        'ck_position_annotations_circles_line_style',
        'position_annotations_circles',
        sa.text("line_style IN ('" + "', '".join(LINE_STYLES) + "')"),
    )


def downgrade() -> None:
    op.drop_constraint(
        'ck_position_annotations_circles_line_style', 'position_annotations_circles', type_='check'
    )
    op.drop_column('position_annotations_circles', 'fill')
    op.drop_column('position_annotations_circles', 'line_style')

    op.drop_constraint(
        'ck_position_annotations_arrows_line_style', 'position_annotations_arrows', type_='check'
    )
    op.drop_column('position_annotations_arrows', 'order')
    op.drop_column('position_annotations_arrows', 'line_style')
