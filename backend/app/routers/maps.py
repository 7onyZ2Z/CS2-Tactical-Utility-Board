from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..dependencies import get_current_user
from ..database import get_db
from ..models import Map
from ..schemas import MapResponse

router = APIRouter(prefix="/api/maps", tags=["maps"])


@router.get("", response_model=list[MapResponse])
def list_maps(
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    return db.query(Map).order_by(Map.id).all()
