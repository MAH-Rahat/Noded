import uuid

from sqlalchemy import ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import TIMESTAMPTZ, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    budget_limit: Mapped[float | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    created_at: Mapped[str] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now()
    )
