import os

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..dependencies import get_current_user, require_role
from ..models import Lineup, Map, User
from ..schemas import LineupCreate, LineupListResponse, LineupResponse, LineupUpdate

router = APIRouter(prefix="/api/lineups", tags=["lineups"])


@router.get("", response_model=LineupListResponse)
def list_lineups(
    map_id: int | None = None,
    utility_type: str | None = None,
    side: str | None = None,
    keyword: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(Lineup).options(joinedload(Lineup.media))

    if map_id is not None:
        query = query.filter(Lineup.map_id == map_id)
    if utility_type:
        query = query.filter(Lineup.utility_type == utility_type)
    if side:
        query = query.filter(Lineup.side == side)
    if keyword:
        query = query.filter(Lineup.name.ilike(f"%{keyword}%"))

    total = query.count()
    items = (
        query.order_by(Lineup.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return LineupListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{lineup_id}", response_model=LineupResponse)
def get_lineup(
    lineup_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    lineup = (
        db.query(Lineup)
        .options(joinedload(Lineup.media))
        .filter(Lineup.id == lineup_id)
        .first()
    )
    if not lineup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lineup not found")
    return lineup


@router.post("", response_model=LineupResponse, status_code=status.HTTP_201_CREATED)
def create_lineup(
    body: LineupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "author")),
):
    if not db.query(Map).filter(Map.id == body.map_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Map not found")
    if body.utility_type not in ("smoke", "flash", "molotov", "he"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="utility_type must be smoke, flash, molotov, or he",
        )
    if body.side not in ("ct", "t"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="side must be ct or t",
        )
    lineup = Lineup(
        name=body.name,
        map_id=body.map_id,
        utility_type=body.utility_type,
        side=body.side,
        pos_x=body.pos_x,
        pos_y=body.pos_y,
        description=body.description,
        created_by=current_user.id,
    )
    db.add(lineup)
    db.commit()
    db.refresh(lineup)
    return lineup


@router.put("/{lineup_id}", response_model=LineupResponse)
def update_lineup(
    lineup_id: int,
    body: LineupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lineup = db.query(Lineup).filter(Lineup.id == lineup_id).first()
    if not lineup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lineup not found")
    if current_user.role != "admin" and lineup.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this lineup",
        )

    update_data = body.model_dump(exclude_unset=True)
    if "map_id" in update_data and not db.query(Map).filter(Map.id == update_data["map_id"]).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Map not found")
    if "utility_type" in update_data and update_data["utility_type"] not in ("smoke", "flash", "molotov", "he"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid utility_type")
    if "side" in update_data and update_data["side"] not in ("ct", "t"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid side")

    for key, value in update_data.items():
        setattr(lineup, key, value)
    db.commit()
    db.refresh(lineup)
    return lineup


@router.delete("/{lineup_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lineup(
    lineup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lineup = (
        db.query(Lineup)
        .options(joinedload(Lineup.media))
        .filter(Lineup.id == lineup_id)
        .first()
    )
    if not lineup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lineup not found")
    if current_user.role != "admin" and lineup.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this lineup",
        )

    from .media import delete_media_files

    delete_media_files(lineup.media)

    db.delete(lineup)
    db.commit()
