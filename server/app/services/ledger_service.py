from decimal import Decimal
from datetime import date, datetime, timezone
from typing import Optional
import uuid

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.category import Category
from ..models.transaction import Transaction
from ..schemas.ledger import (
    CategoryCreate, CategoryUpdate,
    TransactionCreate, LedgerSummaryResponse, MonthlySummaryItem,
)


async def get_categories(db: AsyncSession, user_id: uuid.UUID) -> list[Category]:
    result = await db.execute(
        select(Category).where(Category.user_id == user_id).order_by(Category.name)
    )
    return list(result.scalars().all())


async def create_category(db: AsyncSession, user_id: uuid.UUID, body: CategoryCreate) -> Category:
    now = datetime.now(timezone.utc)
    cat = Category(id=uuid.uuid4(), user_id=user_id, created_at=now, **body.model_dump())
    db.add(cat)
    await db.flush()
    await db.refresh(cat)
    return cat


async def update_category(
    db: AsyncSession, user_id: uuid.UUID, category_id: uuid.UUID, body: CategoryUpdate
) -> Optional[Category]:
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == user_id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        return None
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    await db.flush()
    await db.refresh(cat)
    return cat


async def get_transactions(
    db: AsyncSession, user_id: uuid.UUID, page: int = 1, page_size: int = 20
) -> tuple[list[Transaction], int]:
    offset = (page - 1) * page_size
    count_result = await db.execute(
        select(func.count()).select_from(Transaction).where(Transaction.user_id == user_id)
    )
    total = count_result.scalar_one()
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.date.desc(), Transaction.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    return list(result.scalars().all()), total


async def create_transaction(
    db: AsyncSession, user_id: uuid.UUID, body: TransactionCreate
) -> Transaction:
    now = datetime.now(timezone.utc)
    tx = Transaction(id=uuid.uuid4(), user_id=user_id, created_at=now, updated_at=now, **body.model_dump())
    db.add(tx)
    await db.flush()
    await db.refresh(tx)
    return tx


async def delete_transaction(
    db: AsyncSession, user_id: uuid.UUID, tx_id: uuid.UUID
) -> bool:
    result = await db.execute(
        select(Transaction).where(Transaction.id == tx_id, Transaction.user_id == user_id)
    )
    tx = result.scalar_one_or_none()
    if not tx:
        return False
    await db.delete(tx)
    return True


async def get_ledger_summary(db: AsyncSession, user_id: uuid.UUID) -> LedgerSummaryResponse:
    # Monthly aggregates
    result = await db.execute(
        select(
            func.to_char(Transaction.date, 'YYYY-MM').label('month'),
            Transaction.type,
            func.sum(Transaction.amount).label('total'),
        )
        .where(Transaction.user_id == user_id)
        .group_by('month', Transaction.type)
        .order_by('month')
    )
    rows = result.all()

    monthly_map: dict[str, dict] = {}
    for row in rows:
        m = row.month
        if m not in monthly_map:
            monthly_map[m] = {'income': Decimal(0), 'expenses': Decimal(0)}
        if row.type == 'income':
            monthly_map[m]['income'] += row.total
        else:
            monthly_map[m]['expenses'] += row.total

    monthly = [
        MonthlySummaryItem(
            month=m,
            income=v['income'],
            expenses=v['expenses'],
            burn_rate=v['expenses'] - v['income'],
        )
        for m, v in sorted(monthly_map.items())
    ]

    total_income = sum(item.income for item in monthly)
    total_expenses = sum(item.expenses for item in monthly)

    return LedgerSummaryResponse(
        monthly=monthly,
        total_balance=total_income - total_expenses,
        total_income=total_income,
        total_expenses=total_expenses,
    )
