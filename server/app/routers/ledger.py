import csv
import io
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..middleware.auth_middleware import get_current_user
from ..models.user import User
from ..schemas.common import ResponseModel
from ..schemas.ledger import (
    CategoryCreate, CategoryResponse, CategoryUpdate,
    LedgerSummaryResponse, TransactionCreate, TransactionResponse,
)
from ..services import ledger_service

router = APIRouter(tags=["ledger"])


# ── Categories ────────────────────────────────────────────────────────────────

@router.get("/categories", response_model=ResponseModel[list[CategoryResponse]])
async def list_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cats = await ledger_service.get_categories(db, current_user.id)
    return ResponseModel.success([CategoryResponse.model_validate(c) for c in cats])


@router.post("/categories", response_model=ResponseModel[CategoryResponse], status_code=201)
async def create_category(
    body: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cat = await ledger_service.create_category(db, current_user.id, body)
    return ResponseModel.success(CategoryResponse.model_validate(cat))


@router.patch("/categories/{category_id}", response_model=ResponseModel[CategoryResponse])
async def update_category(
    category_id: uuid.UUID,
    body: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cat = await ledger_service.update_category(db, current_user.id, category_id, body)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return ResponseModel.success(CategoryResponse.model_validate(cat))


# ── Transactions ──────────────────────────────────────────────────────────────

@router.get("/transactions", response_model=ResponseModel[dict])
async def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    txs, total = await ledger_service.get_transactions(db, current_user.id, page, page_size)
    return ResponseModel.success({
        "items": [TransactionResponse.model_validate(t) for t in txs],
        "total": total,
        "page": page,
        "page_size": page_size,
    })


@router.post("/transactions", response_model=ResponseModel[TransactionResponse], status_code=201)
async def create_transaction(
    body: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tx = await ledger_service.create_transaction(db, current_user.id, body)
    return ResponseModel.success(TransactionResponse.model_validate(tx))


@router.delete("/transactions/{tx_id}", response_model=ResponseModel[None])
async def delete_transaction(
    tx_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await ledger_service.delete_transaction(db, current_user.id, tx_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return ResponseModel.success(None)


# ── Summary ───────────────────────────────────────────────────────────────────

@router.get("/summary", response_model=ResponseModel[LedgerSummaryResponse])
async def get_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    summary = await ledger_service.get_ledger_summary(db, current_user.id)
    return ResponseModel.success(summary)


# ── Export ────────────────────────────────────────────────────────────────────

@router.get("/export")
async def export_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    txs, _ = await ledger_service.get_transactions(db, current_user.id, page=1, page_size=10000)
    cats = await ledger_service.get_categories(db, current_user.id)
    cat_map = {str(c.id): c for c in cats}

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["date", "amount", "type", "category", "description", "budget_limit"])
    for tx in txs:
        cat = cat_map.get(str(tx.category_id))
        writer.writerow([
            tx.date,
            tx.amount,
            tx.type,
            cat.name if cat else "",
            tx.description or "",
            cat.budget_limit if cat else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )
