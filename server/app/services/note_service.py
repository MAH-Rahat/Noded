import uuid
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.note import Note
from ..schemas.notes import NoteCreate, NoteUpdate

MAX_PINNED = 3


async def get_notes(db: AsyncSession, user_id: uuid.UUID) -> list[Note]:
    result = await db.execute(
        select(Note)
        .where(Note.user_id == user_id)
        .order_by(Note.pinned.desc(), Note.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_note(db: AsyncSession, user_id: uuid.UUID, note_id: uuid.UUID) -> Optional[Note]:
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_note(db: AsyncSession, user_id: uuid.UUID, body: NoteCreate) -> Note:
    note = Note(id=uuid.uuid4(), user_id=user_id, **body.model_dump())
    db.add(note)
    await db.flush()
    return note


async def update_note(
    db: AsyncSession, user_id: uuid.UUID, note_id: uuid.UUID, body: NoteUpdate
) -> Optional[Note]:
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.user_id == user_id)
    )
    note = result.scalar_one_or_none()
    if not note:
        return None

    updates = body.model_dump(exclude_unset=True)

    # Enforce pin limit
    if updates.get('pinned') is True and not note.pinned:
        count_result = await db.execute(
            select(func.count()).select_from(Note).where(
                Note.user_id == user_id, Note.pinned == True  # noqa: E712
            )
        )
        pinned_count = count_result.scalar_one()
        if pinned_count >= MAX_PINNED:
            raise ValueError(f"Pin limit reached. You can only pin up to {MAX_PINNED} notes.")

    for field, value in updates.items():
        setattr(note, field, value)
    await db.flush()
    return note


async def delete_note(db: AsyncSession, user_id: uuid.UUID, note_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.user_id == user_id)
    )
    note = result.scalar_one_or_none()
    if not note:
        return False
    await db.delete(note)
    return True
