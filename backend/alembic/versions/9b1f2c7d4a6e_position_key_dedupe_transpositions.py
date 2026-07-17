"""normalize position identity to transposition-independent position_key;
switch annotation tables to reference positions.id instead of positions.fen

Same board position reached via different move orders produced different
FEN strings (only halfmove/fullmove clocks differ), so `positions` had
duplicate rows for the same position and annotations attached to one
transposition were invisible on another. This migration:
  1. backfills position_id on the annotation tables (still 1:1 via fen)
  2. computes position_key (FEN fields 1-4) for every position
  3. merges duplicate positions sharing a position_key, repointing
     annotations and repertoire_cards onto the surviving row
  4. makes position_key the unique identity of `positions`, and switches
     annotation tables to FK on position_id

Revision ID: 9b1f2c7d4a6e
Revises: c4d5e6f7a8b9
Create Date: 2026-07-17

"""
from typing import Sequence, Union

import chess
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = '9b1f2c7d4a6e'
down_revision: Union[str, None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ANNOTATION_TABLES = [
    'position_annotations_comments',
    'position_annotations_arrows',
    'position_annotations_circles',
]


def upgrade() -> None:
    bind = op.get_bind()

    # 1. Add position_id to annotation tables, backfill via fen (still 1:1).
    for table in ANNOTATION_TABLES:
        op.add_column(table, sa.Column('position_id', UUID(as_uuid=False), nullable=True))
        op.execute(f"""
            UPDATE {table} a
            SET position_id = p.id
            FROM positions p
            WHERE p.fen = a.fen
        """)

    # 2. Compute position_key for every position.
    op.add_column('positions', sa.Column('position_key', sa.Text(), nullable=True))
    rows = bind.execute(sa.text("SELECT id, fen FROM positions")).fetchall()
    for row in rows:
        key = chess.Board(row.fen).epd()
        bind.execute(
            sa.text("UPDATE positions SET position_key = :key WHERE id = :id"),
            {"key": key, "id": row.id},
        )

    # 3. Merge duplicate positions sharing a position_key.
    dupe_groups = bind.execute(
        sa.text("""
            SELECT position_key, array_agg(id ORDER BY created_at, id) AS ids
            FROM positions
            GROUP BY position_key
            HAVING count(*) > 1
        """)
    ).fetchall()

    for group in dupe_groups:
        survivor_id, *loser_ids = group.ids
        for loser_id in loser_ids:
            for table in ANNOTATION_TABLES:
                bind.execute(
                    sa.text(f"UPDATE {table} SET position_id = :survivor WHERE position_id = :loser"),
                    {"survivor": survivor_id, "loser": loser_id},
                )
            # repertoire_cards has a (user_id, position_id) unique constraint; if the
            # user already has a card on the survivor, drop the loser's card instead
            # of repointing it into a conflict.
            bind.execute(
                sa.text("""
                    DELETE FROM repertoire_cards rc
                    WHERE rc.position_id = :loser
                      AND EXISTS (
                          SELECT 1 FROM repertoire_cards rc2
                          WHERE rc2.position_id = :survivor AND rc2.user_id = rc.user_id
                      )
                """),
                {"loser": loser_id, "survivor": survivor_id},
            )
            bind.execute(
                sa.text("UPDATE repertoire_cards SET position_id = :survivor WHERE position_id = :loser"),
                {"survivor": survivor_id, "loser": loser_id},
            )
            bind.execute(sa.text("DELETE FROM positions WHERE id = :loser"), {"loser": loser_id})

    # 4. Lock down the new schema.
    op.alter_column('positions', 'position_key', nullable=False)
    op.drop_constraint('positions_fen_unique', 'positions', type_='unique')
    op.create_unique_constraint('positions_position_key_unique', 'positions', ['position_key'])

    for table in ANNOTATION_TABLES:
        op.alter_column(table, 'position_id', nullable=False)
        fk_name = f'{table}_fen_fkey'
        op.drop_constraint(fk_name, table, type_='foreignkey')
        op.drop_column(table, 'fen')
        op.create_foreign_key(
            f'{table}_position_id_fkey', table, 'positions', ['position_id'], ['id'], ondelete='CASCADE'
        )
        op.create_index(f'ix_{table}_position_id', table, ['position_id'])


def downgrade() -> None:
    for table in ANNOTATION_TABLES:
        op.drop_index(f'ix_{table}_position_id', table_name=table)
        op.drop_constraint(f'{table}_position_id_fkey', table, type_='foreignkey')
        op.add_column(table, sa.Column('fen', sa.Text(), nullable=True))
        op.execute(f"""
            UPDATE {table} a
            SET fen = p.fen
            FROM positions p
            WHERE p.id = a.position_id
        """)
        op.alter_column(table, 'fen', nullable=False)
        op.create_foreign_key(f'{table}_fen_fkey', table, 'positions', ['fen'], ['fen'], ondelete='CASCADE')
        op.drop_column(table, 'position_id')

    op.drop_constraint('positions_position_key_unique', 'positions', type_='unique')
    op.create_unique_constraint('positions_fen_unique', 'positions', ['fen'])
    op.drop_column('positions', 'position_key')
