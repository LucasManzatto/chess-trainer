"""position_annotations_arrows and position_annotations_circles

Revision ID: b7d4e91a6c33
Revises: a3c9f2b81d44
Create Date: 2026-07-01

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'b7d4e91a6c33'
down_revision: Union[str, None] = 'a3c9f2b81d44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'position_annotations_arrows',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('fen', sa.Text(), sa.ForeignKey('positions.fen', ondelete='CASCADE'), nullable=False),
        sa.Column('from', sa.Text(), nullable=False),
        sa.Column('to', sa.Text(), nullable=False),
        sa.Column('color', sa.Text(), nullable=False),
    )
    op.create_index('ix_position_annotations_arrows_fen', 'position_annotations_arrows', ['fen'])

    op.create_table(
        'position_annotations_circles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('fen', sa.Text(), sa.ForeignKey('positions.fen', ondelete='CASCADE'), nullable=False),
        sa.Column('square', sa.Text(), nullable=False),
        sa.Column('color', sa.Text(), nullable=False),
    )
    op.create_index('ix_position_annotations_circles_fen', 'position_annotations_circles', ['fen'])


def downgrade() -> None:
    op.drop_index('ix_position_annotations_circles_fen', table_name='position_annotations_circles')
    op.drop_table('position_annotations_circles')

    op.drop_index('ix_position_annotations_arrows_fen', table_name='position_annotations_arrows')
    op.drop_table('position_annotations_arrows')
