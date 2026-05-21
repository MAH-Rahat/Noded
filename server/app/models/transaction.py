import uuid

from sqlalchemy import Date, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import TIMESTAMPTZ, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    type: Mapped[str] = mapped_column(String(10), nullable=False)
    date: Mapped[str] = mapped_column(Date, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[str] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[str] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now(), onupdate=func.now()
    )
