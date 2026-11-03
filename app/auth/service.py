"""Authentication service layer for user registration, login, and retrieval."""

from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.database.models import User
from app.auth.security import hash_password, verify_password, create_access_token


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Retrieve a user record by email address."""
    return db.query(User).filter(User.email == email.strip().lower()).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Retrieve a user record by its primary key ID."""
    return db.query(User).filter(User.id == user_id).first()


def validate_password_strength(password: str) -> None:
    """Enforce strong password policy (SEC-6):
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special symbol
    """
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not any(c.isupper() for c in password):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not any(c.islower() for c in password):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not any(c.isdigit() for c in password):
        raise ValueError("Password must contain at least one digit.")
    special_chars = set("!@#$%^&*()_+-=[]{}|;':\",./<>?`~")
    if not any(c in special_chars for c in password):
        raise ValueError("Password must contain at least one special character (!@#$%^&*...).")


def register_user(
    db: Session,
    name: str,
    email: str,
    password: str
) -> User:
    """Register a new user account with hashed password.

    Raises:
        ValueError: If email is already registered or inputs are invalid.
    """
    clean_email = email.strip().lower()
    clean_name = name.strip()

    if not clean_email or "@" not in clean_email:
        raise ValueError("A valid email address is required.")
    validate_password_strength(password)
    if not clean_name:
        raise ValueError("User name is required.")

    existing_user = get_user_by_email(db, clean_email)
    if existing_user:
        # SEC-17: generic message prevents email enumeration.
        raise ValueError("This email cannot be used. Try logging in instead.")

    hashed = hash_password(password)
    user = User(
        name=clean_name,
        email=clean_email,
        hashed_password=hashed
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(
    db: Session,
    email: str,
    password: str
) -> Tuple[Optional[User], Optional[str]]:
    """Authenticate user credentials and issue a JWT access token.

    Returns:
        Tuple of (User, access_token) if valid, or (None, None) if invalid.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None, None

    if not verify_password(password, user.hashed_password):
        return None, None

    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name
    }
    access_token = create_access_token(token_payload)
    return user, access_token
