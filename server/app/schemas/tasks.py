from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime
import uuid


class TaskListCreate(BaseModel):
    name: str
    color: str = "#3B82F6"
    is_active: bool = True


class TaskListResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    color: str
    is_active: bool
    created_at: datetime


class TaskCreate(BaseModel):
    title: str
    date: date
    due_time: Optional[datetime] = None
    priority: str = 'medium'
    notes: Optional[str] = None
    repeat: Optional[str] = None
    list_id: Optional[uuid.UUID] = None
    parent_id: Optional[uuid.UUID] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    state: Optional[str] = None
    sort_order: Optional[int] = None
    due_time: Optional[datetime] = None
    priority: Optional[str] = None
    notes: Optional[str] = None
    repeat: Optional[str] = None
    date: Optional[date] = None
    list_id: Optional[uuid.UUID] = None


class TaskReorderItem(BaseModel):
    id: uuid.UUID
    sort_order: int


class TaskReorderRequest(BaseModel):
    tasks: list[TaskReorderItem]


class TaskResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    user_id: uuid.UUID
    list_id: Optional[uuid.UUID] = None
    parent_id: Optional[uuid.UUID] = None
    title: str
    state: str
    date: date
    sort_order: int
    due_time: Optional[datetime] = None
    priority: str = 'medium'
    notes: Optional[str] = None
    repeat: Optional[str] = None
    notified: bool
    created_at: datetime
    updated_at: datetime
    subtasks: List['TaskResponse'] = []
