from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime
import uuid


class TaskCreate(BaseModel):
    title: str
    date: date
    due_time: Optional[datetime] = None

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


class TaskReorderItem(BaseModel):
    id: uuid.UUID
    sort_order: int


class TaskReorderRequest(BaseModel):
    tasks: list[TaskReorderItem]


class TaskResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    state: str
    date: date
    sort_order: int
    due_time: Optional[datetime] = None
    notified: bool
    created_at: datetime
    updated_at: datetime
