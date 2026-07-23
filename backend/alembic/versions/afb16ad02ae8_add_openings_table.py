"""add openings table

Reintroduces a standalone `openings` table for the raw lichess-org/chess-openings
dataset (eco, name, pgn, uci, epd), separate from `positions`. `openings.epd`
joins to `positions.position_key` (loose join — not every opening has been
reached in a tracked game/repertoire, and vice versa, so no FK constraint).

Revision ID: afb16ad02ae8
Revises: 9b1f2c7d4a6e
Create Date: 2026-07-23

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'afb16ad02ae8'
down_revision: Union[str, None] = '9b1f2c7d4a6e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'openings',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('eco', sa.Text(), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('pgn', sa.Text(), nullable=False),
        sa.Column('uci', sa.Text(), nullable=False),
        sa.Column('epd', sa.Text(), nullable=False),
    )
    op.create_unique_constraint('openings_epd_unique', 'openings', ['epd'])
    op.create_index('idx_openings_eco', 'openings', ['eco'])
    op.create_index(
        'idx_openings_name', 'openings', [sa.text("to_tsvector('simple', name)")], postgresql_using='gin'
    )


def downgrade() -> None:
    op.drop_index('idx_openings_name', table_name='openings')
    op.drop_index('idx_openings_eco', table_name='openings')
    op.drop_table('openings')
