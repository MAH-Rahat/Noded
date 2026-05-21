from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..middleware.auth_middleware import get_current_user
from ..models.category import Category
from ..models.note import Note
from ..models.task import Task
from ..models.user import User
from ..schemas.common import ResponseModel

router = APIRouter(tags=["search"])


@router.get("", response_model=ResponseModel[dict])
async def search(
    q: str = Query(..., min_length=1, max_length=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pattern = f"%{q}%"

    # Notes
    notes_result = await db.execute(
        select(Note.id, Note.title, Note.tag_label)
        .where(Note.user_id == current_user.id, Note.title.ilike(pattern))
        .limit(10)
    )
    notes = [{"id": str(r.id), "title": r.title, "tag_label": r.tag_label, "type": "note"} for r in notes_result.all()]

    # Tasks
    tasks_result = await db.execute(
        select(Task.id, Task.title, Task.state, Task.date)
        .where(Task.user_id == current_user.id, Task.title.ilike(pattern))
        .limit(10)
    )
    tasks = [{"id": str(r.id), "title": r.title, "state": r.state, "date": str(r.date), "type": "task"} for r in tasks_result.all()]

    # Transactions (via category name)
    cats_result = await db.execute(
        select(Category.id, Category.name)
        .where(Category.user_id == current_user.id, Category.name.ilike(pattern))
        .limit(10)
    )
    transactions = [{"id": str(r.id), "title": r.name, "type": "transaction"} for r in cats_result.all()]

    return ResponseModel.success({
        "notes": notes,
        "tasks": tasks,
        "transactions": transactions,
        "total": len(notes) + len(tasks) + len(transactions),
    })
