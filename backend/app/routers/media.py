import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Lineup, Media, User

router = APIRouter(prefix="/api", tags=["media"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm"}


def delete_media_files(media_list: list[Media]):
    for m in media_list:
        filepath = m.file_path
        if os.path.exists(filepath):
            os.remove(filepath)
        dirpath = os.path.dirname(filepath)
        if os.path.isdir(dirpath) and not os.listdir(dirpath):
            os.rmdir(dirpath)


@router.post("/lineups/{lineup_id}/media", status_code=status.HTTP_201_CREATED)
def upload_media(
    lineup_id: int,
    file: UploadFile,
    file_type: str = "image",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lineup = db.query(Lineup).filter(Lineup.id == lineup_id).first()
    if not lineup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lineup not found")
    if current_user.role != "admin" and lineup.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload media for this lineup",
        )

    content_type = file.content_type or ""
    if file_type == "image":
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image must be jpg, png, or webp. Got: {content_type}",
            )
        max_size = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    elif file_type == "video":
        if content_type not in ALLOWED_VIDEO_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Video must be mp4 or webm. Got: {content_type}",
            )
        max_size = settings.MAX_VIDEO_SIZE_MB * 1024 * 1024
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="file_type must be image or video",
        )

    contents = file.file.read()
    if len(contents) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max {settings.MAX_IMAGE_SIZE_MB if file_type == 'image' else settings.MAX_VIDEO_SIZE_MB}MB",
        )

    ext = content_type.split("/")[-1]
    if ext == "jpeg":
        ext = "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    lineup_dir = os.path.join(settings.UPLOAD_DIR, str(lineup_id))
    os.makedirs(lineup_dir, exist_ok=True)
    filepath = os.path.join(lineup_dir, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    max_order = (
        db.query(Media)
        .filter(Media.lineup_id == lineup_id)
        .order_by(Media.sort_order.desc())
        .first()
    )
    next_order = (max_order.sort_order + 1) if max_order else 0

    media = Media(
        lineup_id=lineup_id,
        file_type=file_type,
        file_path=filepath,
        sort_order=next_order,
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    return {"id": media.id, "file_type": media.file_type, "file_path": media.file_path}


@router.delete("/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    lineup = db.query(Lineup).filter(Lineup.id == media.lineup_id).first()
    if current_user.role != "admin" and lineup.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this media",
        )

    delete_media_files([media])
    db.delete(media)
    db.commit()
