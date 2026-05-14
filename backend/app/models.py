from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="viewer")
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    lineups = relationship("Lineup", back_populates="author")


class Map(Base):
    __tablename__ = "maps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    display_name = Column(String, nullable=False)
    image_url = Column(String, nullable=True)

    lineups = relationship("Lineup", back_populates="map")
    tactics = relationship("Tactic", back_populates="map")


class Tactic(Base):
    __tablename__ = "tactics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False, default="full_buy")
    description = Column(Text, nullable=True)
    positions = Column(JSON, nullable=True)
    map_id = Column(Integer, ForeignKey("maps.id"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    map = relationship("Map", back_populates="tactics")


class Lineup(Base):
    __tablename__ = "lineups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    map_id = Column(Integer, ForeignKey("maps.id"), nullable=False, index=True)
    utility_type = Column(String, nullable=False)
    side = Column(String, nullable=False)
    pos_x = Column(Float, nullable=True)
    pos_y = Column(Float, nullable=True)
    pos_z = Column(Integer, nullable=False, default=0)
    description = Column(Text, nullable=True)
    tactics = Column(JSON, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    map = relationship("Map", back_populates="lineups")
    author = relationship("User", back_populates="lineups")
    media = relationship("Media", back_populates="lineup", cascade="all, delete-orphan")


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lineup_id = Column(Integer, ForeignKey("lineups.id"), nullable=False, index=True)
    file_type = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    sort_order = Column(Integer, default=0)

    lineup = relationship("Lineup", back_populates="media")
