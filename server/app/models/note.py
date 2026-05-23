import uuid

from sqlalchemy import Boolean, ForeignKey, String, TIMESTAMP, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    tag_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tag_color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    pinned: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    locked: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
