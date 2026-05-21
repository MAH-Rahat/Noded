import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..models.snippet import Snippet
from ..models.vault_lockout import VaultLockout
from ..models.vault_session import VaultSession
from ..schemas.vault import SnippetCreate, SnippetUpdate

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 10
SESSION_MINUTES = 15


def _get_fernet() -> Fernet:
    key = settings.vault_encryption_key
    if not key:
        raise RuntimeError("VAULT_ENCRYPTION_KEY is not set")
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt(plaintext: str) -> str:
    return _get_fernet().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    try:
        return _get_fernet().decrypt(ciphertext.encode()).decode()
    except InvalidToken:
        raise ValueError("Decryption failed — invalid ciphertext or key")


# ── Vault authentication ──────────────────────────────────────────────────────

async def authenticate_vault(
    db: AsyncSession, user_id: uuid.UUID, pin: str
) -> Optional[str]:
    """
    Verifies the vault PIN against the user's vault_pin_hash.
    Returns a session token on success, raises ValueError on lockout/wrong PIN.
    """
    from ..models.user import User
    from ..services.auth_service import verify_password

    # Check lockout
    lockout_result = await db.execute(
        select(VaultLockout).where(VaultLockout.user_id == user_id)
    )
    lockout = lockout_result.scalar_one_or_none()
    now = datetime.now(timezone.utc)

    if lockout and lockout.locked_until and lockout.locked_until > now:
        remaining = int((lockout.locked_until - now).total_seconds() / 60) + 1
        raise ValueError(f"Vault locked. Try again in {remaining} minute(s).")

    # Get user
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.vault_pin_hash:
        raise ValueError("Vault PIN not set. Please set a PIN in settings.")

    if not verify_password(pin, user.vault_pin_hash):
        # Increment failed attempts
        if not lockout:
            lockout = VaultLockout(id=uuid.uuid4(), user_id=user_id, failed_attempts=1)
            db.add(lockout)
        else:
            lockout.failed_attempts += 1
            if lockout.failed_attempts >= MAX_FAILED_ATTEMPTS:
                lockout.locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
                lockout.failed_attempts = 0
        await db.flush()
        raise ValueError("Incorrect PIN")

    # Success — reset lockout
    if lockout:
        lockout.failed_attempts = 0
        lockout.locked_until = None

    # Create session
    token = secrets.token_hex(32)
    expires_at = now + timedelta(minutes=SESSION_MINUTES)
    session = VaultSession(
        id=uuid.uuid4(),
        user_id=user_id,
        session_token=token,
        expires_at=expires_at,
    )
    db.add(session)
    await db.flush()
    return token, expires_at


async def validate_vault_session(
    db: AsyncSession, user_id: uuid.UUID, session_token: str
) -> bool:
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(VaultSession).where(
            VaultSession.session_token == session_token,
            VaultSession.user_id == user_id,
            VaultSession.expires_at > now,
        )
    )
    return result.scalar_one_or_none() is not None


# ── Snippets ──────────────────────────────────────────────────────────────────

async def get_snippets(db: AsyncSession, user_id: uuid.UUID) -> list[dict]:
    result = await db.execute(
        select(Snippet).where(Snippet.user_id == user_id).order_by(Snippet.created_at.desc())
    )
    snippets = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "user_id": str(s.user_id),
            "label": s.label,
            "content": decrypt(s.ciphertext),
            "snippet_type": s.snippet_type,
            "category_label": s.category_label,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
        }
        for s in snippets
    ]


async def create_snippet(
    db: AsyncSession, user_id: uuid.UUID, body: SnippetCreate
) -> dict:
    ciphertext = encrypt(body.content)
    snippet = Snippet(
        id=uuid.uuid4(),
        user_id=user_id,
        label=body.label,
        ciphertext=ciphertext,
        snippet_type=body.snippet_type,
        category_label=body.category_label,
    )
    db.add(snippet)
    await db.flush()
    return {
        "id": str(snippet.id),
        "user_id": str(snippet.user_id),
        "label": snippet.label,
        "content": body.content,
        "snippet_type": snippet.snippet_type,
        "category_label": snippet.category_label,
        "created_at": snippet.created_at,
        "updated_at": snippet.updated_at,
    }


async def delete_snippet(
    db: AsyncSession, user_id: uuid.UUID, snippet_id: uuid.UUID
) -> bool:
    result = await db.execute(
        select(Snippet).where(Snippet.id == snippet_id, Snippet.user_id == user_id)
    )
    snippet = result.scalar_one_or_none()
    if not snippet:
        return False
    await db.delete(snippet)
    return True
