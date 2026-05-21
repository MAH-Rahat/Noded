import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..middleware.auth_middleware import security
from ..models.token_blocklist import TokenBlocklist
from ..models.user import User
from ..schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from ..schemas.common import ResponseModel
from ..services.auth_service import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=ResponseModel[TokenResponse])
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where((User.username == body.username) | (User.email == body.email))
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already registered",
        )

    user = User(
        id=uuid.uuid4(),
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    await db.flush()

    jti = str(uuid.uuid4())
    token = create_access_token(str(user.id), jti)
    return ResponseModel.success(TokenResponse(access_token=token))


@router.post("/login", response_model=ResponseModel[TokenResponse])
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    jti = str(uuid.uuid4())
    token = create_access_token(str(user.id), jti, remember_me=body.remember_me)
    return ResponseModel.success(TokenResponse(access_token=token))


@router.post("/logout", response_model=ResponseModel[None])
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    token = credentials.credentials
    payload = decode_token(token)
    jti = payload.get("jti", "")
    exp_ts = payload.get("exp", 0)
    expires_at = datetime.fromtimestamp(exp_ts, tz=timezone.utc)

    blocklist_entry = TokenBlocklist(
        id=uuid.uuid4(),
        jti=jti,
        expires_at=expires_at,
    )
    db.add(blocklist_entry)
    return ResponseModel.success(None)
