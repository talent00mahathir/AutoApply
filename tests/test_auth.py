"""Unit tests for Authentication and Security Utilities."""

import pytest
from app.auth.security import hash_password, verify_password, create_access_token, decode_access_token


def test_password_hashing_and_verification():
    plain = "SuperSecretPassword123!"
    hashed = hash_password(plain)

    # Hash should not equal plain
    assert hashed != plain
    # Correct password should verify
    assert verify_password(plain, hashed) is True
    # Wrong password should fail
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_creation_and_decoding():
    payload = {"sub": "42", "email": "test@example.com"}
    token = create_access_token(payload)

    assert isinstance(token, str)
    assert len(token) > 20

    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "42"
    assert decoded["email"] == "test@example.com"
    assert "exp" in decoded
    assert "iat" in decoded


def test_jwt_invalid_token():
    # Tampered or random token should return None
    invalid = decode_access_token("this.is.not.a.valid.jwt.token")
    assert invalid is None


def test_password_strength_enforcement():
    from app.auth.service import validate_password_strength

    # Too short
    with pytest.raises(ValueError, match="at least 8 characters"):
        validate_password_strength("Short1!")

    # Missing uppercase
    with pytest.raises(ValueError, match="uppercase"):
        validate_password_strength("lowercase123!")

    # Missing lowercase
    with pytest.raises(ValueError, match="lowercase"):
        validate_password_strength("UPPERCASE123!")

    # Missing digit
    with pytest.raises(ValueError, match="digit"):
        validate_password_strength("NoDigitsHere!")

    # Missing special symbol
    with pytest.raises(ValueError, match="special character"):
        validate_password_strength("NoSpecialChar123")

    # Valid strong password should pass without exception
    validate_password_strength("StrongP@ssw0rd2026!")


def test_rate_limiter_behavior():
    from fastapi import Request, HTTPException
    from app.auth.limiter import RateLimiter

    limiter = RateLimiter(requests_limit=2, time_window_seconds=10, action_name="test")

    class DummyClient:
        host = "192.168.1.100"

    class DummyRequest:
        client = DummyClient()

    req = DummyRequest()

    # First two should succeed
    limiter(req)
    limiter(req)

    # Third should trigger 429
    with pytest.raises(HTTPException) as exc_info:
        limiter(req)
    assert exc_info.value.status_code == 429


def test_revoked_jwt_token():
    from app.auth.security import revoke_token_by_jti, is_jti_revoked
    test_jti = "test-revoked-uuid-12345"
    assert is_jti_revoked(test_jti) is False
    revoke_token_by_jti(test_jti)
    assert is_jti_revoked(test_jti) is True


def test_email_enumeration_prevention():
    from unittest.mock import MagicMock
    from app.auth.service import register_user

    mock_db = MagicMock()
    # Mock user exists
    with pytest.raises(ValueError, match="This email cannot be used"):
        # Setting get_user_by_email to return an existing user
        from app.auth import service as auth_srv
        orig = auth_srv.get_user_by_email
        try:
            auth_srv.get_user_by_email = lambda db, email: MagicMock()
            register_user(mock_db, name="Test", email="exists@test.com", password="StrongPassword123!")
        finally:
            auth_srv.get_user_by_email = orig


def test_forged_sub_token_returns_401():
    from starlette.testclient import TestClient
    from main import app
    from app.auth.security import create_access_token

    client = TestClient(app)
    # Create valid signed JWT with non-integer sub="abc"
    forged_token = create_access_token({"sub": "abc_not_an_int", "email": "evil@test.com"})
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {forged_token}"})
    assert res.status_code == 401
    assert "Malformed token claims" in res.json().get("detail", "")


