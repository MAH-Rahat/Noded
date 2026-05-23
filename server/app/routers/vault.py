import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ..database import get_db
from ..middleware.auth_middleware import get_current_user
from ..models.user import User
from ..schemas.common import ResponseModel
from ..schemas.vault import VaultAuthRequest, VaultAuthResponse, SnippetCreate, SnippetResponse
from ..services import vault_service
from ..services.auth_service import hash_password

router = APIRouter(tags=["vault"])


@router.get("/status", response_model=ResponseModel[dict])
async def vault_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if the user has set up a vault PIN."""
    return ResponseModel.success({"setup": bool(current_user.vault_pin_hash)})


@router.post("/setup", response_model=ResponseModel[dict])
async def vault_setup(
    body: VaultAuthRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Set the vault PIN for the first time."""
    if current_user.vault_pin_hash:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vault PIN already set")
    from sqlalchemy import select
    from ..models.user import User as UserModel
    result = await db.execute(select(UserModel).where(UserModel.id == current_user.id))
    user = result.scalar_one()
    user.vault_pin_hash = hash_password(body.pin)
    await db.flush()
    return ResponseModel.success({"setup": True})


@router.post("/authenticate", response_model=ResponseModel[VaultAuthResponse])
async def authenticate(
    body: VaultAuthRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        token, expires_at = await vault_service.authenticate_vault(db, current_user.id, body.pin)
    except ValueError as e:
        status_code = status.HTTP_429_TOO_MANY_REQUESTS if "locked" in str(e).lower() else status.HTTP_401_UNAUTHORIZED
        raise HTTPException(status_code=status_code, detail=str(e))
    return ResponseModel.success(VaultAuthResponse(session_token=token, expires_at=expires_at))


async def _require_vault_session(
    current_user: User,
    db: AsyncSession,
    x_vault_token: Optional[str],
):
    if not x_vault_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Vault session token required")
    valid = await vault_service.validate_vault_session(db, current_user.id, x_vault_token)
    if not valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Vault session expired or invalid")


@router.get("/snippets", response_model=ResponseModel[list[dict]])
async def list_snippets(
    x_vault_token: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_vault_session(current_user, db, x_vault_token)
    snippets = await vault_service.get_snippets(db, current_user.id)
    return ResponseModel.success(snippets)


@router.post("/snippets", response_model=ResponseModel[dict], status_code=201)
async def create_snippet(
    body: SnippetCreate,
    x_vault_token: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_vault_session(current_user, db, x_vault_token)
    snippet = await vault_service.create_snippet(db, current_user.id, body)
    return ResponseModel.success(snippet)


@router.delete("/snippets/{snippet_id}", response_model=ResponseModel[None])
async def delete_snippet(
    snippet_id: uuid.UUID,
    x_vault_token: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_vault_session(current_user, db, x_vault_token)
    deleted = await vault_service.delete_snippet(db, current_user.id, snippet_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Snippet not found")
    return ResponseModel.success(None)
