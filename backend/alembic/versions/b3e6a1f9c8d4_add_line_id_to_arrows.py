"""add line_id grouping tag to arrows

Chains multiple arrows into one "plan" (e.g. Nf6 -> Bg4 -> e3 -> Nc6): arrows
sharing a line_id belong to the same sequence, ordered by the existing
`order` column. No FK — it's just a grouping tag scoped to a position, not a
row with its own attributes.

Revision ID: b3e6a1f9c8d4
Revises: a7b8c9d0e1f2
Create Date: 2026-08-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'b3e6a1f9c8d4'
down_revision: Union[str, None] = 'a7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'position_annotations_arrows',
        sa.Column('line_id', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index(
        'ix_position_annotations_arrows_line_id',
        'position_annotations_arrows',
        ['line_id'],
    )


def downgrade() -> None:
    op.drop_index('ix_position_annotations_arrows_line_id', table_name='position_annotations_arrows')
    op.drop_column('position_annotations_arrows', 'line_id')
