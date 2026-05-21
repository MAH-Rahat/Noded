import logging
import uuid
from datetime import date, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import AsyncSessionLocal
from ..models.task import Task

logger = logging.getLogger(__name__)


async def rollover_job() -> None:
    """
    Runs at midnight. Marks all pending tasks from previous days as 'delayed'
    and creates new 'pending' copies for today.
    """
    today = date.today()
    yesterday = today - timedelta(days=1)

    try:
        async with AsyncSessionLocal() as db:
            # Find all pending tasks from before today
            result = await db.execute(
                select(Task).where(Task.state == 'pending', Task.date < today)
            )
            stale_tasks = result.scalars().all()

            if not stale_tasks:
                logger.info("Rollover job: no stale tasks found.")
                return

            new_tasks = []
            for task in stale_tasks:
                # Mark original as delayed
                task.state = 'delayed'

                # Create a fresh pending copy for today
                new_tasks.append(Task(
                    id=uuid.uuid4(),
                    user_id=task.user_id,
                    title=task.title,
                    state='pending',
                    date=today,
                    sort_order=task.sort_order,
                    due_time=None,  # don't carry over due times
                    notified=False,
                ))

            db.add_all(new_tasks)
            await db.commit()
            logger.info(f"Rollover job: processed {len(stale_tasks)} tasks.")

    except Exception as exc:
        logger.error(f"Rollover job failed at {date.today().isoformat()}: {exc}", exc_info=True)
        raise
