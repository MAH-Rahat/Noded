import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import AsyncSessionLocal
from ..models.push_subscription import PushSubscription
from ..models.task import Task

logger = logging.getLogger(__name__)


async def push_dispatcher() -> None:
    """
    Runs every 60 seconds. Finds tasks with due_time in the next 60s
    that haven't been notified yet, and sends push notifications.
    """
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(seconds=60)

    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Task).where(
                    Task.due_time >= now,
                    Task.due_time <= window_end,
                    Task.notified == False,  # noqa: E712
                    Task.state == 'pending',
                )
            )
            due_tasks = result.scalars().all()

            if not due_tasks:
                return

            for task in due_tasks:
                # Get push subscription for this user
                sub_result = await db.execute(
                    select(PushSubscription).where(PushSubscription.user_id == task.user_id)
                )
                sub = sub_result.scalar_one_or_none()

                if sub:
                    try:
                        _send_push(sub, task.title)
                        task.notified = True
                    except Exception as e:
                        logger.warning(f"Push failed for task {task.id}: {e}")
                else:
                    # No subscription — just mark as notified to avoid retrying
                    task.notified = True

            await db.commit()
            logger.info(f"Push dispatcher: processed {len(due_tasks)} due tasks.")

    except Exception as exc:
        logger.error(f"Push dispatcher failed: {exc}", exc_info=True)


def _send_push(sub: PushSubscription, task_title: str) -> None:
    """Send a Web Push notification via pywebpush."""
    import json
    from pywebpush import webpush, WebPushException
    from ..config import settings

    if not settings.vapid_private_key:
        return  # VAPID not configured — skip silently

    payload = json.dumps({
        "title": "Noded Reminder",
        "body": task_title,
        "icon": "/icons/icon-192.png",
    })

    webpush(
        subscription_info={
            "endpoint": sub.endpoint,
            "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
        },
        data=payload,
        vapid_private_key=settings.vapid_private_key,
        vapid_claims={"sub": f"mailto:{settings.vapid_claims_email}"},
    )
