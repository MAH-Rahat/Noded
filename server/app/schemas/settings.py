from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class PreferencesUpdate(BaseModel):
    accent_color: Optional[str] = None
    background_color: Optional[str] = None
    onboarding_completed: Optional[bool] = None


class UserProfileResponse(BaseModel):
    id: str
    username: str
    email: str
    accent_color: str
    background_color: str
    onboarding_completed: bool
    session_login_time: Optional[datetime] = None
    session_expires_at: Optional[datetime] = None
