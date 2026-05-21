import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.password_reset_token import PasswordResetToken
from ..models.user import User
from ..schemas.auth import ForgotPasswordRequest, ResetPasswordRequest
from ..schemas.common import ResponseModel
from ..services.auth_service import hash_password

router = APIRouter(tags=["auth"])


@router.post("/forgot-password", response_model=ResponseModel[None])
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    # Always return success to prevent email enumeration
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user:
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        reset_token = PasswordResetToken(
            id=uuid.uuid4(),
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        db.add(reset_token)
        # In production: send email with reset link containing raw_token
        # e.g. f"{settings.frontend_url}/reset-password/{raw_token}"

    return ResponseModel.success(None)


@router.post("/reset-password", response_model=ResponseModel[None])
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    token_hash = hashlib.sha256(body.token.encode()).hexdigest()
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False,  # noqa: E712
            PasswordResetToken.expires_at > now,
        )
    )
    reset_token = result.scalar_one_or_none()

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Reset token is invalid, expired, or already used",
        )

    # Update password
    user_result = await db.execute(select(User).where(User.id == reset_token.user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(body.new_password)
    reset_token.used = True

    return ResponseModel.success(None)
