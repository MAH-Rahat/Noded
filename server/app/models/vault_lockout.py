import uuid

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.dialects.postgresql import TIMESTAMPTZ, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class VaultLockout(Base):
    __tablename__ = "vault_lockouts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    failed_attempts: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="0"
    )
    locked_until: Mapped[str | None] = mapped_column(TIMESTAMPTZ, nullable=True)
