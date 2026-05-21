import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..middleware.auth_middleware import get_current_user
from ..models.user import User
from ..schemas.common import ResponseModel
from ..schemas.tasks import TaskCreate, TaskReorderRequest, TaskResponse, TaskUpdate
from ..services import task_service

router = APIRouter(tags=["tasks"])


@router.get("", response_model=ResponseModel[list[TaskResponse]])
async def list_tasks(
    task_date: Optional[date] = Query(None, alias="date"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tasks = await task_service.get_tasks(db, current_user.id, task_date)
    return ResponseModel.success([TaskResponse.model_validate(t) for t in tasks])


@router.post("", response_model=ResponseModel[TaskResponse], status_code=201)
async def create_task(
    body: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.create_task(db, current_user.id, body)
    return ResponseModel.success(TaskResponse.model_validate(task))


@router.patch("/{task_id}", response_model=ResponseModel[TaskResponse])
async def update_task(
    task_id: uuid.UUID,
    body: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.update_task(db, current_user.id, task_id, body)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return ResponseModel.success(TaskResponse.model_validate(task))


@router.delete("/{task_id}", response_model=ResponseModel[None])
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await task_service.delete_task(db, current_user.id, task_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return ResponseModel.success(None)


@router.patch("/reorder", response_model=ResponseModel[None])
async def reorder_tasks(
    body: TaskReorderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await task_service.reorder_tasks(db, current_user.id, body)
    return ResponseModel.success(None)


@router.get("/history", response_model=ResponseModel[dict])
async def completion_history(
    days: int = Query(30, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    history = await task_service.get_completion_history(db, current_user.id, days)
    return ResponseModel.success(history)
