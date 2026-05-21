import io
import uuid
import zipfile

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..middleware.auth_middleware import get_current_user
from ..models.user import User
from ..schemas.common import ResponseModel
from ..schemas.notes import NoteCreate, NoteResponse, NoteUpdate
from ..services import note_service

router = APIRouter(tags=["notes"])


@router.get("", response_model=ResponseModel[list[NoteResponse]])
async def list_notes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notes = await note_service.get_notes(db, current_user.id)
    return ResponseModel.success([NoteResponse.model_validate(n) for n in notes])


@router.post("", response_model=ResponseModel[NoteResponse], status_code=201)
async def create_note(
    body: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    note = await note_service.create_note(db, current_user.id, body)
    return ResponseModel.success(NoteResponse.model_validate(note))


@router.get("/export")
async def export_notes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notes = await note_service.get_notes(db, current_user.id)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        for note in notes:
            filename = f"{note.title[:50].replace('/', '_')}.md"
            zf.writestr(filename, note.body)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=notes.zip"},
    )


@router.get("/{note_id}", response_model=ResponseModel[NoteResponse])
async def get_note(
    note_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    note = await note_service.get_note(db, current_user.id, note_id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return ResponseModel.success(NoteResponse.model_validate(note))


@router.patch("/{note_id}", response_model=ResponseModel[NoteResponse])
async def update_note(
    note_id: uuid.UUID,
    body: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        note = await note_service.update_note(db, current_user.id, note_id, body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return ResponseModel.success(NoteResponse.model_validate(note))


@router.delete("/{note_id}", response_model=ResponseModel[None])
async def delete_note(
    note_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await note_service.delete_note(db, current_user.id, note_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return ResponseModel.success(None)
