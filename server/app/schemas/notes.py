from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import uuid


class NoteCreate(BaseModel):
    title: str
    body: str
    tag_label: Optional[str] = None
    tag_color: Optional[str] = None

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Note body cannot be empty")
        return v


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    tag_label: Optional[str] = None
    tag_color: Optional[str] = None
    pinned: Optional[bool] = None


class NoteResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    body: str
    tag_label: Optional[str] = None
    tag_color: Optional[str] = None
    pinned: bool
    created_at: datetime
    updated_at: datetime
