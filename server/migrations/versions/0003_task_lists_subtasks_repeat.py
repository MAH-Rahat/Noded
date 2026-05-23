"""add task_lists, subtasks, repeat, notes to tasks

Revision ID: 0003_task_lists_subtasks_repeat
Revises: 0002_add_priority_note_fields
Create Date: 2026-05-23 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003_task_lists_subtasks_repeat"
down_revision = "0002_add_priority_note_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Task lists table
    op.create_table(
        "task_lists",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("color", sa.String(20), nullable=False, server_default="#3B82F6"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # New columns on tasks
    op.add_column("tasks", sa.Column("list_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("task_lists.id", ondelete="SET NULL"), nullable=True))
    op.add_column("tasks", sa.Column("parent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True))
    op.add_column("tasks", sa.Column("notes", sa.Text, nullable=True))
    op.add_column("tasks", sa.Column("repeat", sa.String(20), nullable=True))

    # Make priority non-nullable with default
    op.alter_column("tasks", "priority", nullable=False, server_default="medium")


def downgrade() -> None:
    op.drop_column("tasks", "repeat")
    op.drop_column("tasks", "notes")
    op.drop_column("tasks", "parent_id")
    op.drop_column("tasks", "list_id")
    op.drop_table("task_lists")
