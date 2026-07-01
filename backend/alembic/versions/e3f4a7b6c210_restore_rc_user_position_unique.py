"""restore rc_user_position_unique constraint

Revision ID: e3f4a7b6c210
Revises: d210f10aa685
Create Date: 2026-07-01

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'e3f4a7b6c210'
down_revision: Union[str, None] = 'd210f10aa685'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        'rc_user_position_unique', 'repertoire_cards', ['user_id', 'position_id']
    )


def downgrade() -> None:
    op.drop_constraint('rc_user_position_unique', 'repertoire_cards', type_='unique')
