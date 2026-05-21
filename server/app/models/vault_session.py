import uuid

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.dialects.postgresql import TIMESTAMPTZ, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class VaultSession(Base):
    __tablename__ = "vault_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    session_token: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )
    expires_at: Mapped[str] = mapped_column(TIMESTAMPTZ, nullable=False)
    created_at: Mapped[str] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now()
    )
