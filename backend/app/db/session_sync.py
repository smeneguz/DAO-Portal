from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from app.core.config import settings

# Create synchronous SQLAlchemy engine for Celery
sync_engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI_SYNC,
    pool_pre_ping=True,
    echo=settings.DEBUG
)

# Create synchronous session factory
SyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine
)


def init_db_sync() -> None:
    """Initialize the database synchronously."""
    SQLModel.metadata.create_all(bind=sync_engine)


def get_db_sync() -> Generator:
    """Get synchronous database session."""
    db = SyncSessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()