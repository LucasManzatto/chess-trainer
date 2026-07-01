"""rename position_comments to position_annotations_comments (fen-keyed);
drop position_moves and position_move_stats

Revision ID: d210f10aa685
Revises: b7d4e91a6c33
Create Date: 2026-07-01

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'd210f10aa685'
down_revision: Union[str, None] = 'b7d4e91a6c33'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.rename_table('position_comments', 'position_annotations_comments')

    op.add_column('position_annotations_comments', sa.Column('fen', sa.Text(), nullable=True))
    op.execute(
        """
        UPDATE position_annotations_comments c
        SET fen = p.fen
        FROM positions p
        WHERE p.id = c.position_id
        """
    )
    op.alter_column('position_annotations_comments', 'fen', nullable=False)
    op.create_foreign_key(
        'position_annotations_comments_fen_fkey',
        'position_annotations_comments',
        'positions',
        ['fen'],
        ['fen'],
        ondelete='CASCADE',
    )

    op.drop_column('position_annotations_comments', 'user_id')
    op.drop_column('position_annotations_comments', 'position_id')

    op.drop_table('position_moves')
    op.drop_table('position_move_stats')


def downgrade() -> None:
    op.create_table(
        'position_move_stats',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('moves', postgresql.ARRAY(sa.Text()), nullable=False, unique=True),
        sa.Column('stats', postgresql.JSONB(), nullable=False),
        sa.Column('fetched_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    op.create_table(
        'position_moves',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('from_position_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('to_position_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('san', sa.Text(), nullable=False),
        sa.Column('lan', sa.Text(), nullable=False),
        sa.Column('is_main_line', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('commentary', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['from_position_id'], ['positions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['to_position_id'], ['positions.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_position_moves_from_position_id', 'position_moves', ['from_position_id'])

    op.add_column('position_annotations_comments', sa.Column('position_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('position_annotations_comments', sa.Column('user_id', sa.Text(), nullable=True))
    op.execute(
        """
        UPDATE position_annotations_comments c
        SET position_id = p.id, user_id = ''
        FROM positions p
        WHERE p.fen = c.fen
        """
    )
    op.alter_column('position_annotations_comments', 'position_id', nullable=False)
    op.alter_column('position_annotations_comments', 'user_id', nullable=False)
    op.create_foreign_key(
        'position_comments_position_id_fkey',
        'position_annotations_comments',
        'positions',
        ['position_id'],
        ['id'],
        ondelete='CASCADE',
    )

    op.drop_constraint(
        'position_annotations_comments_fen_fkey', 'position_annotations_comments', type_='foreignkey'
    )
    op.drop_column('position_annotations_comments', 'fen')

    op.rename_table('position_annotations_comments', 'position_comments')
