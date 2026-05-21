import uuid

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import TIMESTAMPTZ, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    state: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="pending"
    )
    date: Mapped[str] = mapped_column(Date, nullable=False)
    sort_order: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="0"
    )
    due_time: Mapped[str | None] = mapped_column(TIMESTAMPTZ, nullable=True)
    notified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    created_at: Mapped[str] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[str] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now(), onupdate=func.now()
    )
