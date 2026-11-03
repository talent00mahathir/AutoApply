"""Unit tests for Typst Resume Generator and Escaping Logic."""

import pytest
from app.services.pdf_service import (
    escape_typst,
    generate_typst_resume_pdf,
    generate_tailored_resume_pdf
)


def test_escape_typst_special_characters():
    raw_text = "Email: user@example.com, Price: $100, Tag: #1, Code: `print()`, Array: [1, 2], Arrow: <foo>"
    escaped = escape_typst(raw_text)

    # All special characters should be backslash-escaped
    assert r"\@" in escaped
    assert r"\$" in escaped
    assert r"\#" in escaped
    assert r"\`" in escaped
    assert r"\[" in escaped
    assert r"\]" in escaped
    assert r"\<" in escaped
    assert r"\>" in escaped


def test_typst_resume_compilation():
    sample_cv = {
        "contact_info": {
            "name": "Mohammad Test",
            "email": "test@domain.com",
            "phone": "+880 1712-000000",
            "github_url": "https://github.com/mohammad"
        },
        "professional_summary": "Experienced software engineer with expertise in distributed systems.",
        "categorized_skills": {
            "Languages": ["Python", "TypeScript", "SQL"],
            "Frameworks": ["FastAPI", "React", "Docker"]
        },
        "tailored_projects": [
            {
                "project_name": "AutoApply Assistant",
                "technologies": ["Python", "Typst"],
                "xyz_bullets": [
                    "Engineered a high-performance ATS resume compiler achieving 50ms build latency."
                ]
            }
        ],
        "education": [
            {
                "degree": "B.Sc. in Computer Science",
                "institution": "University of Technology",
                "period": "2023 - 2027"
            }
        ]
    }

    pdf_bytes = generate_typst_resume_pdf(sample_cv)

    # Result must be valid binary PDF bytes
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 5000
    assert pdf_bytes.startswith(b"%PDF-")


def test_master_generate_tailored_resume_pdf():
    sample_cv = {
        "contact_info": {"name": "Jane Doe", "email": "jane@example.com"},
        "professional_summary": "Full Stack Developer",
        "categorized_skills": {"Languages": ["Python"]},
        "tailored_projects": [],
        "education": []
    }

    pdf_bytes = generate_tailored_resume_pdf(sample_cv)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF-")
