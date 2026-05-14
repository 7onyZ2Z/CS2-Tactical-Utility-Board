from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# --- Auth ---


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "viewer"


# --- Users ---


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserRoleUpdate(BaseModel):
    role: str


# --- Maps ---


class MapResponse(BaseModel):
    id: int
    name: str
    display_name: str
    image_url: Optional[str] = None

    model_config = {"from_attributes": True}


# --- Tactics ---


class PositionData(BaseModel):
    x: float
    y: float
    z: int = 0
    duty: Optional[str] = None


class TacticCreate(BaseModel):
    name: str
    category: str = "full_buy"
    description: Optional[str] = None
    positions: Optional[dict[str, Optional[PositionData]]] = None
    map_id: int


class TacticUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    positions: Optional[dict[str, Optional[PositionData]]] = None
    map_id: Optional[int] = None


class TacticResponse(BaseModel):
    id: int
    name: str
    category: str = "full_buy"
    description: Optional[str] = None
    positions: Optional[dict[str, Optional[PositionData]]] = None
    map_id: int

    model_config = {"from_attributes": True}


# --- Lineups ---


class TacticAssignment(BaseModel):
    tactic_id: int
    executor: Optional[int] = None


class LineupCreate(BaseModel):
    name: str
    map_id: int
    utility_type: str
    side: str
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    pos_z: int = 0
    description: Optional[str] = None
    tactics: Optional[list[TacticAssignment]] = None


class LineupUpdate(BaseModel):
    name: Optional[str] = None
    map_id: Optional[int] = None
    utility_type: Optional[str] = None
    side: Optional[str] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    pos_z: Optional[int] = None
    description: Optional[str] = None
    tactics: Optional[list[TacticAssignment]] = None


class MediaResponse(BaseModel):
    id: int
    lineup_id: int
    file_type: str
    file_path: str
    sort_order: int

    model_config = {"from_attributes": True}


class LineupResponse(BaseModel):
    id: int
    name: str
    map_id: int
    utility_type: str
    side: str
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    pos_z: int = 0
    description: Optional[str] = None
    tactics: Optional[list[TacticAssignment]] = None
    created_by: int
    created_at: datetime
    updated_at: datetime
    media: list[MediaResponse] = []

    model_config = {"from_attributes": True}


class LineupListResponse(BaseModel):
    items: list[LineupResponse]
    total: int
    page: int
    page_size: int
