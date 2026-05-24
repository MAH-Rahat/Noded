import logging
import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import AsyncSessionLocal
from ..models.task import Task

logger = logging.getLogger(__name__)


async def rollover_job() -> None:
    """
    Runs at midnight:
    1. Marks all pending tasks from previous days as 'delayed' and creates new copies for today.
    2. Auto-deletes completed tasks older than 2 days.
    """
    today = date.today()
    two_days_ago = today - timedelta(days=2)

    try:
        async with AsyncSessionLocal() as db:
            # ── 1. Rollover pending tasks ─────────────────────────────────────
            result = await db.execute(
                select(Task).where(Task.state == 'pending', Task.date < today)
            )
            stale_tasks = result.scalars().all()

            new_tasks = []
            for task in stale_tasks:
                task.state = 'delayed'
                new_tasks.append(Task(
                    id=uuid.uuid4(),
                    user_id=task.user_id,
                    title=task.title,
                    state='pending',
                    date=today,
                    sort_order=task.sort_order,
                    due_time=None,
                    notified=False,
                ))

            if new_tasks:
                db.add_all(new_tasks)
                logger.info(f"Rollover job: processed {len(stale_tasks)} tasks.")

            # ── 2. Auto-delete completed tasks older than 2 days ─────────────
            await db.execute(
                delete(Task).where(
                    Task.state == 'completed',
                    Task.date <= two_days_ago,
                )
            )
            logger.info(f"Rollover job: deleted completed tasks older than {two_days_ago}.")

            await db.commit()

    except Exception as exc:
        logger.error(f"Rollover job failed at {date.today().isoformat()}: {exc}", exc_info=True)
        raise
