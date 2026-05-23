"""add priority to tasks, locked and category to notes

Revision ID: 0002_add_priority_note_fields
Revises: 0001_initial_schema
Create Date: 2026-05-23 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_add_priority_note_fields"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("priority", sa.String(10), nullable=True, server_default="medium"))
    op.add_column("notes", sa.Column("locked", sa.Boolean, nullable=False, server_default=sa.false()))
    op.add_column("notes", sa.Column("category", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("tasks", "priority")
    op.drop_column("notes", "locked")
    op.drop_column("notes", "category")
