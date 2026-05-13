from sqlalchemy.orm import Session

from .auth import hash_password
from .models import Map, User

MAPS = [
    ("dust2", "Dust II"),
    ("mirage", "Mirage"),
    ("inferno", "Inferno"),
    ("nuke", "Nuke"),
    ("overpass", "Overpass"),
    ("ancient", "Ancient"),
    ("anubis", "Anubis"),
    ("vertigo", "Vertigo"),
    ("cache", "Cache"),
]


def seed(db: Session):
    if not db.query(User).filter(User.username == "admin").first():
        admin = User(
            username="admin",
            hashed_password=hash_password("admin123"),
            role="admin",
        )
        db.add(admin)

    for name, display_name in MAPS:
        if not db.query(Map).filter(Map.name == name).first():
            db.add(Map(name=name, display_name=display_name))

    db.commit()
