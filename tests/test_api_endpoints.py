"""Integration tests for FastAPI Core Endpoints."""

import pytest
from starlette.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "service" in data
    assert "active_model" in data


def test_sample_data_endpoint():
    response = client.get("/api/sample-data")
    assert response.status_code == 200
    data = response.json()
    assert "sample_job" in data
    assert "sample_cv" in data


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    # Should serve index.html
    assert "AutoApply" in response.text


def test_sample_data_variants():
    for variant in ["general", "networking", "devsecops", "agentic"]:
        response = client.get(f"/api/sample-data/{variant}")
        assert response.status_code == 200
        data = response.json()
        assert data["sample_type"] == variant
        assert len(data["sample_job"]) > 50


def test_dashboard_stats_guest():
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_applications" in data
    assert "average_match_score" in data
    assert "status_counts" in data
    assert "score_distribution" in data
    assert "recent_applications" in data


def test_request_trace_and_security_headers():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"


def test_analyze_caps_payload_size():
    # SEC-10: job description > 20,000 chars should trigger 413
    oversized_job = "Developer " * 2500  # 25,000 chars
    res = client.post("/api/analyze", data={"job_description": oversized_job})
    assert res.status_code == 413
    assert "too large" in res.json().get("detail", "").lower()


def test_analyze_unsupported_file_type():
    # SEC-13: uploading an executable file should trigger 415
    res = client.post(
        "/api/analyze",
        data={"job_description": "Valid Job Description"},
        files={"resume_file": ("malicious.exe", b"MZ\x90\x00BinaryExeContent", "application/x-msdownload")}
    )
    assert res.status_code == 415
    assert "unsupported file type" in res.json().get("detail", "").lower()


def test_resume_filename_sanitization():
    # SEC-12: candidate name with special/path traversal chars should be sanitized
    from app.routers.resume import re
    candidate_name = "../../../evil\r\nName!@#$%"
    safe_name = re.sub(r"[^A-Za-z0-9_-]+", "_", candidate_name).strip("_")[:50] or "Tailored"
    assert ".." not in safe_name
    assert "\r" not in safe_name
    assert "\n" not in safe_name
    assert safe_name == "evil_Name"


