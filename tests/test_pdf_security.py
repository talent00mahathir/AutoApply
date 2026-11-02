"""Unit tests for PDF Ingestion Security Validations."""

import pytest
from app.services.pdf_service import extract_text_from_pdf, MAX_PDF_SIZE_BYTES


def test_empty_pdf_raises_error():
    with pytest.raises(ValueError, match="Uploaded PDF file is empty"):
        extract_text_from_pdf(b"")


def test_invalid_magic_bytes_rejected():
    fake_pdf = b"This is a text file masquerading as a PDF."
    with pytest.raises(ValueError, match="Missing '%PDF-' binary signature"):
        extract_text_from_pdf(fake_pdf)


def test_oversized_file_rejected():
    # 5MB + 1 byte
    oversized = b"%PDF-" + (b"0" * (MAX_PDF_SIZE_BYTES + 10))
    with pytest.raises(ValueError, match="exceeds the maximum allowed size"):
        extract_text_from_pdf(oversized)


def test_valid_pdf_magic_bytes_detected():
    # Minimal valid PDF structure
    minimal_pdf = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< >>\n%%EOF"
    # Should not raise magic byte or empty error (may raise no extractable text, which is expected for empty pages)
    try:
        extract_text_from_pdf(minimal_pdf)
    except ValueError as e:
        # Expected error is about no extractable text, NOT about invalid magic bytes
        assert "Missing '%PDF-'" not in str(e)
