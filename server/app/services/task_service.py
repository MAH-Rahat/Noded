import uuid
from datetime import date, datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.task import Task, TaskList
from ..schemas.tasks import TaskCreate, TaskUpdate, TaskReorderRequest, TaskListCreate


# ── Task Lists ────────────────────────────────────────────────────────────────

async def get_lists(db: AsyncSession, user_id: uuid.UUID) -> list[TaskList]:
    result = await db.execute(
        select(TaskList).where(TaskList.user_id == user_id).order_by(TaskList.created_at)
    )
    return list(result.scalars().all())


async def create_list(db: AsyncSession, user_id: uuid.UUID, body: TaskListCreate) -> TaskList:
    tl = TaskList(
        id=uuid.uuid4(), user_id=user_id,
        name=body.name, color=body.color, is_active=body.is_active,
        created_at=datetime.now(timezone.utc),
    )
    db.add(tl)
    await db.flush()
    await db.refresh(tl)
    return tl


async def delete_list(db: AsyncSession, user_id: uuid.UUID, list_id: uuid.UUID) -> bool:
    result = await db.execute(select(TaskList).where(TaskList.id == list_id, TaskList.user_id == user_id))
    tl = result.scalar_one_or_none()
    if not tl:
        return False
    await db.delete(tl)
    return True


# ── Tasks ─────────────────────────────────────────────────────────────────────

async def get_all_tasks(db: AsyncSession, user_id: uuid.UUID, list_id: Optional[uuid.UUID] = None) -> list[Task]:
    """Get all non-completed tasks across all dates, plus recently completed."""
    q = select(Task).where(Task.user_id == user_id, Task.parent_id == None)  # noqa: E711
    if list_id:
        q = q.where(Task.list_id == list_id)
    q = q.order_by(Task.date, Task.priority.desc(), Task.sort_order)
    result = await db.execute(q)
    tasks = list(result.scalars().all())

    # Attach subtasks
    for task in tasks:
        sub_result = await db.execute(
            select(Task).where(Task.parent_id == task.id).order_by(Task.sort_order)
        )
        task._subtasks = list(sub_result.scalars().all())

    return tasks


async def get_tasks(db: AsyncSession, user_id: uuid.UUID, for_date: Optional[date] = None) -> list[Task]:
    target = for_date or date.today()
    result = await db.execute(
        select(Task)
        .where(Task.user_id == user_id, Task.date == target, Task.parent_id == None)  # noqa: E711
        .order_by(Task.sort_order, Task.created_at)
    )
    tasks = list(result.scalars().all())
    for task in tasks:
        sub_result = await db.execute(
            select(Task).where(Task.parent_id == task.id).order_by(Task.sort_order)
        )
        task._subtasks = list(sub_result.scalars().all())
    return tasks


async def create_task(db: AsyncSession, user_id: uuid.UUID, body: TaskCreate) -> Task:
    now = datetime.now(timezone.utc)
    task = Task(
        id=uuid.uuid4(), user_id=user_id,
        title=body.title, date=body.date,
        due_time=body.due_time, priority=body.priority or 'medium',
        notes=body.notes, repeat=body.repeat,
        list_id=body.list_id, parent_id=body.parent_id,
        state='pending', sort_order=0,
        created_at=now, updated_at=now,
    )
    db.add(task)
    await db.flush()
    await db.refresh(task)
    task._subtasks = []
    return task


async def update_task(db: AsyncSession, user_id: uuid.UUID, task_id: uuid.UUID, body: TaskUpdate) -> Optional[Task]:
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    task = result.scalar_one_or_none()
    if not task:
        return None

    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(task, field, value)
    task.updated_at = datetime.now(timezone.utc)

    # If completing a recurring task, spawn next instance
    if updates.get('state') == 'completed' and task.repeat and task.repeat != 'none':
        await _spawn_next_recurring(db, task)

    # If completing a subtask, check if parent should auto-complete
    if updates.get('state') == 'completed' and task.parent_id:
        await _check_parent_completion(db, user_id, task.parent_id)

    await db.flush()
    await db.refresh(task)

    # Attach subtasks
    sub_result = await db.execute(select(Task).where(Task.parent_id == task.id).order_by(Task.sort_order))
    task._subtasks = list(sub_result.scalars().all())
    return task


async def _spawn_next_recurring(db: AsyncSession, task: Task) -> None:
    """Create the next instance of a recurring task."""
    current_date = task.date if isinstance(task.date, date) else date.fromisoformat(str(task.date))
    if task.repeat == 'daily':
        next_date = current_date + timedelta(days=1)
    elif task.repeat == 'weekly':
        next_date = current_date + timedelta(weeks=1)
    elif task.repeat == 'monthly':
        month = current_date.month + 1
        year = current_date.year + (month - 1) // 12
        month = ((month - 1) % 12) + 1
        next_date = current_date.replace(year=year, month=month)
    else:
        return

    now = datetime.now(timezone.utc)
    new_task = Task(
        id=uuid.uuid4(), user_id=task.user_id,
        title=task.title, date=next_date,
        due_time=task.due_time, priority=task.priority,
        notes=task.notes, repeat=task.repeat,
        list_id=task.list_id, parent_id=None,
        state='pending', sort_order=0,
        created_at=now, updated_at=now,
    )
    db.add(new_task)
    await db.flush()


async def _check_parent_completion(db: AsyncSession, user_id: uuid.UUID, parent_id: uuid.UUID) -> None:
    """Auto-complete parent if all subtasks are done."""
    sub_result = await db.execute(select(Task).where(Task.parent_id == parent_id))
    subtasks = list(sub_result.scalars().all())
    if subtasks and all(t.state == 'completed' for t in subtasks):
        parent_result = await db.execute(select(Task).where(Task.id == parent_id, Task.user_id == user_id))
        parent = parent_result.scalar_one_or_none()
        if parent:
            parent.state = 'completed'
            parent.updated_at = datetime.now(timezone.utc)
            await db.flush()


async def delete_task(db: AsyncSession, user_id: uuid.UUID, task_id: uuid.UUID) -> bool:
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    task = result.scalar_one_or_none()
    if not task:
        return False
    await db.delete(task)
    return True


async def reorder_tasks(db: AsyncSession, user_id: uuid.UUID, body: TaskReorderRequest) -> bool:
    for item in body.tasks:
        result = await db.execute(select(Task).where(Task.id == item.id, Task.user_id == user_id))
        task = result.scalar_one_or_none()
        if task:
            task.sort_order = item.sort_order
    await db.flush()
    return True


async def get_completion_history(db: AsyncSession, user_id: uuid.UUID, days: int = 30) -> dict[str, bool]:
    today = date.today()
    start = today - timedelta(days=days)
    result = await db.execute(
        select(Task.date, Task.state)
        .where(Task.user_id == user_id, Task.date >= start, Task.date <= today, Task.parent_id == None)  # noqa: E711
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
    return {d: v['total'] > 0 and v['completed'] == v['total'] for d, v in day_map.items()}
