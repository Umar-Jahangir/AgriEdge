"""SQLAlchemy database setup — SQLite local-first."""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings

settings = get_settings()
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from app.models import entities  # noqa: F401

    settings.images_dir.mkdir(parents=True, exist_ok=True)
    (settings.images_dir.parent).mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
