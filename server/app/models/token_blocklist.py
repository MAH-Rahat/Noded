import uuid

from sqlalchemy import String, func
from sqlalchemy.dialects.postgresql import TIMESTAMPTZ, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class TokenBlocklist(Base):
    __tablename__ = "token_blocklist"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    jti: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[str] = mapped_column(TIMESTAMPTZ, nullable=False)
    created_at: Mapped[str] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now()
    )
