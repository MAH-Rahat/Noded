from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import uuid


class NoteCreate(BaseModel):
    title: str
    body: str = ""
    tag_label: Optional[str] = None
    tag_color: Optional[str] = None
    category: Optional[str] = None
    locked: bool = False


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    tag_label: Optional[str] = None
    tag_color: Optional[str] = None
    pinned: Optional[bool] = None
    locked: Optional[bool] = None
    category: Optional[str] = None


class NoteResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    body: str
    tag_label: Optional[str] = None
    tag_color: Optional[str] = None
    pinned: bool
    locked: bool = False
    category: Optional[str] = None
    created_at: datetime
    updated_at: datetime
