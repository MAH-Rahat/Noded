import uuid

from sqlalchemy import ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import TIMESTAMPTZ, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class Snippet(Base):
    __tablename__ = "snippets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    ciphertext: Mapped[str] = mapped_column(Text, nullable=False)
    snippet_type: Mapped[str] = mapped_column(String(20), nullable=False)
    category_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[str] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[str] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now(), onupdate=func.now()
    )
