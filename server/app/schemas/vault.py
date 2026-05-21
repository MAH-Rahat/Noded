from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class VaultAuthRequest(BaseModel):
    pin: str


class VaultAuthResponse(BaseModel):
    session_token: str
    expires_at: datetime


class SnippetCreate(BaseModel):
    label: str
    content: str  # plaintext — will be encrypted by service
    snippet_type: str
    category_label: Optional[str] = None


class SnippetUpdate(BaseModel):
    label: Optional[str] = None
    content: Optional[str] = None
    snippet_type: Optional[str] = None
    category_label: Optional[str] = None


class SnippetResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    user_id: uuid.UUID
    label: str
    content: str  # decrypted plaintext returned to frontend
    snippet_type: str
    category_label: Optional[str] = None
    created_at: datetime
    updated_at: datetime
