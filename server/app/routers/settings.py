import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..middleware.auth_middleware import get_current_user
from ..models.user import User
from ..schemas.common import ResponseModel
from ..schemas.settings import (
    PasswordChangeRequest, PreferencesUpdate, ProfileUpdate, UserProfileResponse,
)
from ..services.auth_service import hash_password, verify_password

router = APIRouter(tags=["settings"])


@router.get("/profile", response_model=ResponseModel[UserProfileResponse])
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return ResponseModel.success(UserProfileResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        accent_color=current_user.accent_color,
        background_color=current_user.background_color,
        onboarding_completed=current_user.onboarding_completed,
    ))


@router.patch("/profile", response_model=ResponseModel[UserProfileResponse])
async def update_profile(
    body: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.email and body.email != current_user.email:
        result = await db.execute(select(User).where(User.email == body.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")
        current_user.email = body.email

    if body.display_name:
        current_user.username = body.display_name

    await db.flush()
    return ResponseModel.success(UserProfileResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        accent_color=current_user.accent_color,
        background_color=current_user.background_color,
        onboarding_completed=current_user.onboarding_completed,
    ))


@router.patch("/password", response_model=ResponseModel[None])
async def change_password(
    body: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")

    if len(body.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must be at least 8 characters")

    current_user.password_hash = hash_password(body.new_password)
    await db.flush()
    return ResponseModel.success(None)


@router.patch("/preferences", response_model=ResponseModel[UserProfileResponse])
async def update_preferences(
    body: PreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.accent_color is not None:
        current_user.accent_color = body.accent_color
    if body.background_color is not None:
        current_user.background_color = body.background_color
    if body.onboarding_completed is not None:
        current_user.onboarding_completed = body.onboarding_completed

    await db.flush()
    return ResponseModel.success(UserProfileResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        accent_color=current_user.accent_color,
        background_color=current_user.background_color,
        onboarding_completed=current_user.onboarding_completed,
    ))
