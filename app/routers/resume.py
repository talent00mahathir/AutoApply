"""Resume Router: Exporting and generating ATS-compliant tailored resume PDFs."""

import re

from fastapi import APIRouter, Depends, HTTPException, Response, status
from app.services.pdf_service import generate_tailored_resume_pdf
from app.schemas.analysis import ExportPdfRequest
from app.auth.limiter import export_pdf_limiter

router = APIRouter(prefix="/api/resume", tags=["Resume Export"])


@router.post("/export-pdf", dependencies=[Depends(export_pdf_limiter)])
def export_tailored_resume_pdf(request: ExportPdfRequest):
    """Compile tailored CV data into an ATS-friendly, professional PDF resume.

    Accepts the complete or user-edited tailored CV JSON and returns a downloadable PDF binary.
    """
    if not request.tailored_cv or not isinstance(request.tailored_cv, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid tailored CV dictionary is required."
        )

    try:
        pdf_bytes = generate_tailored_resume_pdf(request.tailored_cv)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF resume: {str(e)}"
        )

    candidate_name = (
        request.tailored_cv.get("contact_info", {}).get("name")
        or "Tailored"
    )
    # SEC-12: LLM/user name was header-injectable. Whitelist + truncate.
    safe_name = re.sub(r"[^A-Za-z0-9_-]+", "_", candidate_name).strip("_")[:50] or "Tailored"
    filename = f"{safe_name}_Resume.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "application/pdf"
        }
    )
