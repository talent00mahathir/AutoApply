"""Analysis Router: PDF ingestion, Google ADK 4-agent execution, and tailoring."""

from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import User, Application, ApplicationContent
from app.dependencies import get_optional_user
from app.services.pdf_service import extract_text_from_pdf
from app.pipeline.service import run_pipeline
from app.schemas.analysis import AnalysisResponse
from app.auth.limiter import analyze_limiter

# Project root directory (robust regardless of CWD)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

router = APIRouter(prefix="/api", tags=["Application Analysis"])


import logging

logger = logging.getLogger("autoapply.analysis")

SAMPLE_FILES = {
    "general": "SAMPLE_JOB_POSTING.txt",
    "networking": "SAMPLE_JOB_1_DISTRIBUTED_NETWORKING.txt",
    "devsecops": "SAMPLE_JOB_2_DEVSECOPS_BACKEND.txt",
    "agentic": "SAMPLE_JOB_3_AGENTIC_AI_WORKFLOWS.txt",
    "cv": "mahathir_cv.md"
}


@router.get("/sample-data")
@router.get("/sample-data/{sample_type}")
def get_sample_data(sample_type: Optional[str] = None):
    """Returns sample job posting and candidate CV for quick UI demo testing.
    Supports sample types: general, networking, devsecops, agentic, or cv.
    """
    job_filename = SAMPLE_FILES.get(sample_type, "SAMPLE_JOB_POSTING.txt") if sample_type != "cv" else "SAMPLE_JOB_POSTING.txt"
    job_paths = [
        PROJECT_ROOT / "data" / "samples" / job_filename,
        PROJECT_ROOT / job_filename
    ]
    cv_paths = [
        PROJECT_ROOT / "data" / "samples" / "mahathir_cv.md",
        PROJECT_ROOT / "mahathir_cv.md"
    ]
    sample_job = ""
    sample_cv = ""
    for p in job_paths:
        if p.exists():
            sample_job = p.read_text(encoding="utf-8")
            break
    for p in cv_paths:
        if p.exists():
            sample_cv = p.read_text(encoding="utf-8")
            break
    return {
        "sample_type": sample_type or "general",
        "sample_job": sample_job,
        "sample_cv": sample_cv
    }


@router.post("/analyze", response_model=AnalysisResponse, dependencies=[Depends(analyze_limiter)])
async def analyze_application(
    job_description: str = Form(..., description="Raw text of the job description/posting"),
    resume_file: Optional[UploadFile] = File(None, description="Uploaded resume file (PDF, TXT, or Markdown)"),
    resume_text: Optional[str] = Form(None, description="Optional raw text of the resume"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Analyze a job description against an uploaded resume using the 4-agent ADK pipeline.

    - Extracts text from PDF using pypdf (or decodes plain text/markdown directly).
    - Can also accept raw resume text if no file is uploaded.
    - Runs Agent 1 (Job Parser), Agent 2 (Resume Analyzer), Agent 3 (Matcher), and Agent 4 (Google XYZ Writer).
    - Returns structured JSON with match score, gaps, tailored bullets, cover letter, and complete tailored CV.
    """
    # SEC-10: unbounded pasted text was LLM DoS vector. Clamp both fields.
    MAX_JOB_CHARS = 20000
    MAX_RESUME_CHARS = 20000
    if len(job_description or "") > MAX_JOB_CHARS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Job description too large. Maximum {MAX_JOB_CHARS} characters."
        )
    if resume_text and len(resume_text) > MAX_RESUME_CHARS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Resume text too large. Maximum {MAX_RESUME_CHARS} characters."
        )
    if not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text cannot be empty."
        )

    # 1. Read uploaded file content if provided
    extracted_text = ""
    if resume_file and resume_file.filename:
        file_bytes = await resume_file.read()
        if file_bytes:
            # 5 MB upload clamp to prevent memory exhaustion DoS
            if len(file_bytes) > 5 * 1024 * 1024:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Uploaded file exceeds the maximum allowed limit of 5 MB."
                )

            filename = (resume_file.filename or "").lower()
            content_type = (resume_file.content_type or "").lower()

            # SEC-13: exe renamed .txt was accepted + fed to LLM. Strict whitelist.
            ALLOWED_EXTS = (".pdf", ".txt", ".md", ".markdown")
            ALLOWED_CT = ("application/pdf", "text/plain", "text/markdown", "application/octet-stream", "")
            if not filename.endswith(ALLOWED_EXTS) or content_type.split(";")[0].strip() not in ALLOWED_CT:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="Unsupported file type. Upload PDF, TXT, or Markdown only."
                )

            if filename.endswith(".pdf") or "pdf" in content_type:
                try:
                    extracted_text = extract_text_from_pdf(file_bytes)
                except ValueError as e:
                    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
            else:
                try:
                    extracted_text = file_bytes.decode("utf-8")
                except UnicodeDecodeError:
                    try:
                        extracted_text = file_bytes.decode("latin-1")
                    except Exception:
                        raise HTTPException(
                            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Unsupported file encoding. Please upload a standard PDF or text file."
                        )

    # 2. Fall back to raw text if no file was uploaded
    if not extracted_text.strip() and resume_text and resume_text.strip():
        extracted_text = resume_text.strip()

    if not extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a resume file (PDF/MD/TXT) or paste resume text."
        )

    # 3. Execute the 4-Agent Pipeline
    user_id_tag = f"user_{current_user.id}" if current_user else "guest_session"
    try:
        pipeline_result = await run_pipeline(
            job_text=job_description,
            resume_text=extracted_text,
            user_id=user_id_tag
        )
    except Exception as e:
        logger.error(f"AI Pipeline Execution Error for {user_id_tag}: {e}", exc_info=True)
        err_msg = str(e).lower()
        if "quota" in err_msg or "resource_exhausted" in err_msg or "rate" in err_msg:
            detail = "Gemini API rate limit or quota exceeded. Please wait a moment and try again."
        elif "api_key" in err_msg or "permission" in err_msg or "credential" in err_msg:
            detail = "Gemini API authentication issue. Please check your backend GOOGLE_API_KEY."
        else:
            detail = "The AI multi-agent analysis encountered a processing error. Please check your input and try again."
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )



    return AnalysisResponse(
        session_id=pipeline_result["session_id"],
        active_model=pipeline_result.get("active_model", "gemini-3.5-flash-lite"),
        job_requirements=pipeline_result["job_requirements"],
        candidate_profile=pipeline_result["candidate_profile"],
        match_analysis=pipeline_result["match_analysis"],
        tailored_content=pipeline_result["tailored_content"],
        final_tailored_cv=pipeline_result["final_tailored_cv"]
    )
