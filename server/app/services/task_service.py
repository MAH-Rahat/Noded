import uuid
from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.task import Task
from ..schemas.tasks import TaskCreate, TaskUpdate, TaskReorderRequest


async def get_tasks(db: AsyncSession, user_id: uuid.UUID, for_date: Optional[date] = None) -> list[Task]:
    target = for_date or date.today()
    result = await db.execute(
        select(Task)
        .where(Task.user_id == user_id, Task.date == target)
        .order_by(Task.sort_order, Task.created_at)
    )
    return list(result.scalars().all())


async def create_task(db: AsyncSession, user_id: uuid.UUID, body: TaskCreate) -> Task:
    task = Task(
        id=uuid.uuid4(),
        user_id=user_id,
        title=body.title,
        date=body.date,
        due_time=body.due_time,
        state='pending',
        sort_order=0,
    )
    db.add(task)
    await db.flush()
    return task


async def update_task(
    db: AsyncSession, user_id: uuid.UUID, task_id: uuid.UUID, body: TaskUpdate
) -> Optional[Task]:
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        return None
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.flush()
    return task


async def delete_task(db: AsyncSession, user_id: uuid.UUID, task_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        return False
    await db.delete(task)
    return True


async def reorder_tasks(
    db: AsyncSession, user_id: uuid.UUID, body: TaskReorderRequest
) -> bool:
    for item in body.tasks:
        result = await db.execute(
            select(Task).where(Task.id == item.id, Task.user_id == user_id)
        )
        task = result.scalar_one_or_none()
        if task:
            task.sort_order = item.sort_order
    await db.flush()
    return True


async def get_completion_history(
    db: AsyncSession, user_id: uuid.UUID, days: int = 30
) -> dict[str, bool]:
    """Returns a dict of date_str -> all_completed for the past N days."""
    from datetime import timedelta
    today = date.today()
    start = today - timedelta(days=days)

    result = await db.execute(
        select(Task.date, Task.state)
        .where(Task.user_id == user_id, Task.date >= start, Task.date <= today)
    )
    rows = result.all()

    day_map: dict[str, dict] = {}
    for row in rows:
        d = str(row.date)
        if d not in day_map:
            day_map[d] = {'total': 0, 'completed': 0}
        day_map[d]['total'] += 1
        if row.state == 'completed':
            day_map[d]['completed'] += 1

    return {
        d: v['total'] > 0 and v['completed'] == v['total']
        for d, v in day_map.items()
    }
