from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
import uuid


class CategoryCreate(BaseModel):
    name: str
    color: Optional[str] = None
    budget_limit: Optional[Decimal] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    budget_limit: Optional[Decimal] = None


class CategoryResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    color: Optional[str] = None
    budget_limit: Optional[Decimal] = None
    created_at: datetime


class TransactionCreate(BaseModel):
    category_id: Optional[uuid.UUID] = None
    amount: Decimal
    type: str
    date: date
    description: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_nonzero(cls, v: Decimal) -> Decimal:
        if v == 0:
            raise ValueError("Amount cannot be zero")
        return v

    @field_validator("type")
    @classmethod
    def type_valid(cls, v: str) -> str:
        if v not in ("income", "expense"):
            raise ValueError("Type must be 'income' or 'expense'")
        return v


class TransactionResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    amount: Decimal
    type: str
    date: date
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class MonthlySummaryItem(BaseModel):
    month: str  # "YYYY-MM"
    income: Decimal
    expenses: Decimal
    burn_rate: Decimal


class LedgerSummaryResponse(BaseModel):
    monthly: list[MonthlySummaryItem]
    total_balance: Decimal
    total_income: Decimal
    total_expenses: Decimal
