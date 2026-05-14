from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_role
from ..models import Lineup, Tactic, Map, User
from ..schemas import TacticCreate, TacticResponse, TacticUpdate

router = APIRouter(prefix="/api/tactics", tags=["tactics"])


@router.get("", response_model=list[TacticResponse])
def list_tactics(
    map_id: int | None = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(Tactic)
    if map_id is not None:
        query = query.filter(Tactic.map_id == map_id)
    return query.order_by(Tactic.id.desc()).all()


@router.get("/{tactic_id}", response_model=TacticResponse)
def get_tactic(
    tactic_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    tactic = db.query(Tactic).filter(Tactic.id == tactic_id).first()
    if not tactic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tactic not found")
    return tactic


@router.post("", response_model=TacticResponse, status_code=status.HTTP_201_CREATED)
def create_tactic(
    body: TacticCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role("admin", "author")),
):
    if not db.query(Map).filter(Map.id == body.map_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Map not found")
    if body.category not in ("eco", "force_buy", "full_buy"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="category must be eco, force_buy, or full_buy")
    positions_data = None
    if body.positions:
        positions_data = {k: (v.model_dump() if v else None) for k, v in body.positions.items()}
    tactic = Tactic(name=body.name, category=body.category, description=body.description, positions=positions_data, map_id=body.map_id, created_by=_current_user.id)
    db.add(tactic)
    db.commit()
    db.refresh(tactic)
    return tactic


@router.put("/{tactic_id}", response_model=TacticResponse)
def update_tactic(
    tactic_id: int,
    body: TacticUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "author")),
):
    tactic = db.query(Tactic).filter(Tactic.id == tactic_id).first()
    if not tactic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tactic not found")
    if current_user.role != "admin" and tactic.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this tactic")
    update_data = body.model_dump(exclude_unset=True)
    if "map_id" in update_data and not db.query(Map).filter(Map.id == update_data["map_id"]).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Map not found")
    if "category" in update_data and update_data["category"] not in ("eco", "force_buy", "full_buy"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category")
    for key, value in update_data.items():
        setattr(tactic, key, value)
    db.commit()
    db.refresh(tactic)
    return tactic


@router.delete("/{tactic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tactic(
    tactic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "author")),
):
    tactic = db.query(Tactic).filter(Tactic.id == tactic_id).first()
    if not tactic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tactic not found")
    if current_user.role != "admin" and tactic.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this tactic")

    for lineup in db.query(Lineup).all():
        if lineup.tactics:
            new_tactics = [t for t in lineup.tactics if t.get("tactic_id") != tactic_id]
            if len(new_tactics) != len(lineup.tactics):
                lineup.tactics = new_tactics if new_tactics else None

    db.delete(tactic)
    db.commit()
