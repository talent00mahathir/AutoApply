"""Authentication router: User registration, login, and profile retrieval."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import User, Application
from app.auth.service import register_user, authenticate_user, validate_password_strength
from app.auth.security import hash_password, verify_password
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    UserProfileUpdateRequest,
    PasswordChangeRequest,
    AccountStatsResponse
)
from app.dependencies import get_current_user, security_scheme
from fastapi.security import HTTPAuthorizationCredentials
from typing import Optional
from app.auth.limiter import register_limiter, login_limiter
from app.auth.security import revoke_token_by_jti, decode_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(register_limiter)])
def register(request: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account, hash password with bcrypt, and return JWT access token."""
    try:
        user = register_user(
            db=db,
            name=request.name,
            email=request.email,
            password=request.password
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Automatically log the user in upon registration
    auth_user, token = authenticate_user(db, request.email, request.password)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(login_limiter)])
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate user credentials and issue a signed JWT access token."""
    user, token = authenticate_user(db, request.email, request.password)
    if not user or not token:
        # SEC-19: log failures without password, generic message prevents enum.
        import logging
        logging.getLogger("autoapply.auth").warning(f"Failed login attempt email={request.email.strip().lower()}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve the profile of the currently authenticated user."""
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
def update_profile(
    request: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's display name."""
    clean_name = request.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name cannot be empty."
        )
    current_user.name = clean_name
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.put("/password")
def change_password(
    request: PasswordChangeRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Securely change user's account password with verification of existing password."""
    if not verify_password(request.current_password, current_user.hashed_password):
        # SEC-19: log failed password-change attempt without secrets.
        import logging
        logging.getLogger("autoapply.auth").warning(f"Failed password change for user_id={current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    try:
        validate_password_strength(request.new_password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    current_user.hashed_password = hash_password(request.new_password)
    db.commit()
    # SEC-14: revoke presenting jti so stolen copies die with password change.
    try:
        if credentials is not None:
            payload = decode_access_token(credentials.credentials)
            if payload and payload.get("jti"):
                revoke_token_by_jti(payload["jti"])
    except Exception:
        pass
    return {"success": True, "message": "Password updated successfully. Please log in again."}


@router.delete("/account")
def delete_account(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete account and all associated applications (GDPR compliant)."""
    # SEC-14: revoke token before wiping user row.
    try:
        if credentials is not None:
            payload = decode_access_token(credentials.credentials)
            if payload and payload.get("jti"):
                revoke_token_by_jti(payload["jti"])
    except Exception:
        pass
    # Delete all applications owned by user
    db.query(Application).filter(Application.user_id == current_user.id).delete()
    db.delete(current_user)
    db.commit()
    return {"success": True, "message": "Account and all associated data permanently deleted."}


@router.get("/stats", response_model=AccountStatsResponse)
def get_account_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get high-level summary and account statistics for the active user."""
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    total_apps = len(apps)
    highest_score = max([a.match_score for a in apps], default=0)
    top_companies = list({a.company_name for a in apps if a.company_name})[:5]

    return AccountStatsResponse(
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        member_since=current_user.created_at.strftime("%B %d, %Y"),
        total_applications=total_apps,
        highest_match_score=highest_score,
        top_companies=top_companies
    )

