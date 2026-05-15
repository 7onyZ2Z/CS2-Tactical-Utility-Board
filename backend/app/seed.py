from sqlalchemy.orm import Session

from .auth import hash_password
from .models import Map, User

MAPS = [
    ("dust2", "Dust II", "de_dust2.png"),
    ("mirage", "Mirage", "de_mirage.png"),
    ("inferno", "Inferno", "de_inferno.png"),
    ("nuke", "Nuke", "de_nuke.png"),
    ("overpass", "Overpass", "de_overpass.png"),
    ("ancient", "Ancient", "de_ancient.png"),
    ("anubis", "Anubis", "de_anubis.png"),
    ("vertigo", "Vertigo", "de_vertigo.png"),
    ("cache", "Cache", "de_cache.png"),
    ("train", "Train", "de_train.png"),
]


def seed(db: Session):
    users = [
        ("admin", "admin123", "admin"),
        ("igl", "cqucs2", "author"),
        ("entry", "cqucs2", "author"),
        ("awper", "cqucs2", "author"),
        ("lurker", "cqucs2", "author"),
        ("support", "cqucs2", "author"),
        ("guest", "guest123", "viewer"),
    ]
    for username, password, role in users:
        if not db.query(User).filter(User.username == username).first():
            db.add(User(username=username, hashed_password=hash_password(password), role=role))

    for name, display_name, image_file in MAPS:
        existing = db.query(Map).filter(Map.name == name).first()
        image_url = f"uploads/map/{image_file}"
        if not existing:
            db.add(Map(name=name, display_name=display_name, image_url=image_url))
        elif not existing.image_url:
            existing.image_url = image_url

    db.commit()
