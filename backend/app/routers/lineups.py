import json
import os

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..dependencies import get_current_user, require_role
from ..models import Lineup, Map, Tactic, User
from ..schemas import LineupCreate, LineupListResponse, LineupResponse, LineupUpdate

router = APIRouter(prefix="/api/lineups", tags=["lineups"])


@router.get("", response_model=LineupListResponse)
def list_lineups(
    map_id: int | None = None,
    utility_type: str | None = None,
    side: str | None = None,
    tactic_id: int | None = None,
    keyword: str | None = None,
    sort_by: str = Query("created_at", pattern=r"^(created_at|name)$"),
    sort_order: str = Query("desc", pattern=r"^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    sort_col = Lineup.name if sort_by == "name" else Lineup.created_at
    sort_fn = sort_col.asc() if sort_order == "asc" else sort_col.desc()

    query = db.query(Lineup).options(joinedload(Lineup.media))

    if map_id is not None:
        query = query.filter(Lineup.map_id == map_id)
    if utility_type:
        query = query.filter(Lineup.utility_type == utility_type)
    if side:
        query = query.filter(Lineup.side == side)
    if keyword:
        query = query.filter(Lineup.name.ilike(f"%{keyword}%"))

    if tactic_id is not None:
        all_lineups = query.order_by(sort_fn).all()
        filtered = [
            l for l in all_lineups
            if l.tactics and any(t.get("tactic_id") == tactic_id for t in l.tactics)
        ]
        total = len(filtered)
        start = (page - 1) * page_size
        items = filtered[start:start + page_size]
        return LineupListResponse(items=items, total=total, page=page, page_size=page_size)

    total = query.count()
    items = (
        query.order_by(sort_fn)
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

    tactics_data = None
    if body.tactics:
        for t in body.tactics:
            if not db.query(Tactic).filter(Tactic.id == t.tactic_id).first():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Tactic {t.tactic_id} not found")
            if t.executor is not None and (t.executor < 1 or t.executor > 5):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="executor must be between 1 and 5")
        tactics_data = [t.model_dump() for t in body.tactics]

    lineup = Lineup(
        name=body.name,
        map_id=body.map_id,
        utility_type=body.utility_type,
        side=body.side,
        pos_x=body.pos_x,
        pos_y=body.pos_y,
        pos_z=body.pos_z,
        description=body.description,
        tactics=tactics_data,
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

    if "tactics" in update_data:
        tactics_list = update_data.pop("tactics")
        if tactics_list is not None:
            existing_ids = {t.get("tactic_id") for t in (lineup.tactics or [])}
            serialized = []
            for t in tactics_list:
                d = t if isinstance(t, dict) else t.model_dump()
                if d["tactic_id"] not in existing_ids:
                    if not db.query(Tactic).filter(Tactic.id == d["tactic_id"]).first():
                        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Tactic {d['tactic_id']} not found")
                serialized.append(d)
            update_data["tactics"] = serialized if serialized else None
        else:
            update_data["tactics"] = None

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
