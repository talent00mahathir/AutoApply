"""Security utilities: Bcrypt Password Hashing and JWT Token Management."""

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Set
import bcrypt
import jwt
from dotenv import load_dotenv

load_dotenv()

import logging

logger = logging.getLogger("autoapply.auth")

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "FATAL: JWT_SECRET_KEY is not set in .env! "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\" "
        "and add it to your .env file."
    )

ALGORITHM = "HS256"
# SEC-14: 24h was too long for localStorage JWT. 60min limits theft window.
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# SEC-14: in-memory revoked jti set (use Redis in prod multi-worker).
_REVOKED_JTI: Set[str] = set()


def revoke_token_by_jti(jti: str) -> None:
    """SEC-14: blacklist a JWT id on password change / account delete."""
    if jti:
        _REVOKED_JTI.add(jti)


def is_jti_revoked(jti: str) -> bool:
    return jti in _REVOKED_JTI if jti else False



def hash_password(plain_password: str) -> str:
    """Hash a plaintext password using bcrypt with a generated salt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed_bytes = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed_bytes.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify that a plaintext password matches the stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Generate a signed JWT access token containing user payload."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "jti": str(uuid.uuid4())})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token. Returns payload or None if invalid/expired/revoked."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # SEC-14: reject revoked tokens (password change / account delete).
        if is_jti_revoked(payload.get("jti", "")):
            return None
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
