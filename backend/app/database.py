import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
    # Test database connectivity
    with engine.connect() as conn:
        pass
    logger.info("Successfully connected to primary database.")
except Exception as e:
    logger.warning(f"Primary database connection failed ({e}). Falling back to SQLite local database.")
    fallback_url = "sqlite:///./dev_fallback.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency that yields a database session and closes it on completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
