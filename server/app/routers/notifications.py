import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..middleware.auth_middleware import get_current_user
from ..models.push_subscription import PushSubscription
from ..models.user import User
from ..schemas.common import ResponseModel

router = APIRouter(tags=["notifications"])


class PushSubscribeRequest(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


@router.post("/subscribe", response_model=ResponseModel[None])
async def subscribe(
    body: PushSubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Upsert: remove old subscription for this user, add new one
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.user_id == current_user.id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        await db.delete(existing)

    sub = PushSubscription(
        id=uuid.uuid4(),
        user_id=current_user.id,
        endpoint=body.endpoint,
        p256dh=body.p256dh,
        auth=body.auth,
    )
    db.add(sub)
    return ResponseModel.success(None)


@router.delete("/subscribe", response_model=ResponseModel[None])
async def unsubscribe(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.user_id == current_user.id)
    )
    sub = result.scalar_one_or_none()
    if sub:
        await db.delete(sub)
    return ResponseModel.success(None)
