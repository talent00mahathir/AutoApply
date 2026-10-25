"""Pydantic schemas for authentication and user accounts."""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(...)
    # SEC-18: aligned with validate_password_strength (8 + complexity), was 6.
    password: str = Field(..., min_length=8, max_length=128)

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Mahathir Mohammad",
                "email": "mmahathir398@gmail.com",
                "password": "Password123!"
            }
        }
    }


class UserLoginRequest(BaseModel):
    email: str = Field(...)
    password: str = Field(...)

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "mmahathir398@gmail.com",
                "password": "Password123!"
            }
        }
    }


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserProfileUpdateRequest(BaseModel):
    """Payload to update user profile information."""
    name: str = Field(..., min_length=1, max_length=100)


class PasswordChangeRequest(BaseModel):
    """Payload to update account password."""
    current_password: str = Field(...)
    new_password: str = Field(...)


class AccountStatsResponse(BaseModel):
    """User account usage metrics and summary."""
    user_id: int
    name: str
    email: str
    member_since: str
    total_applications: int
    highest_match_score: int
    top_companies: list[str]
