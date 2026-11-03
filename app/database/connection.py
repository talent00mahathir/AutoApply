"""SQLAlchemy Database Configuration and Session Management."""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

# Default to local MySQL (XAMPP default user is root with no password)
DEFAULT_DB_URL = "mysql+pymysql://root:@localhost:3306/autoapply?charset=utf8mb4"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Automatically reconnect dropped connections
        pool_recycle=3600,   # Recycle connections every hour
        echo=False
    )
except Exception:
    # Graceful fallback to SQLite for local development if MySQL is unreachable
    SQLITE_URL = "sqlite:///./autoapply_dev.db"
    engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI and service dependency that provides an isolated DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all defined tables in the database if they do not exist.
    
    Attempts to connect to configured MySQL database; automatically falls back
    to local SQLite if MySQL is offline or not installed.
    """
    global engine
    import app.database.models  # Ensure models are registered with Base metadata

    try:
        # Test connection actively
        with engine.connect() as conn:
            pass
        Base.metadata.create_all(bind=engine)
        print("[DATABASE] Connected to primary database (MySQL) and synchronized tables.")
    except Exception as exc:
        print(f"[DATABASE] Notice: Primary database connection failed ({exc}).")
        print("[DATABASE] Falling back to local SQLite development database (autoapply_dev.db)...")
        try:
            engine.dispose()
        except Exception:
            pass
        engine = create_engine(
            "sqlite:///./autoapply_dev.db",
            connect_args={"check_same_thread": False}
        )
        SessionLocal.configure(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("[DATABASE] Local SQLite database initialized successfully.")

