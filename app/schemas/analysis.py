"""Pydantic schemas for application analysis and tailoring."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AnalysisResponse(BaseModel):
    session_id: str
    active_model: Optional[str] = "gemini-3.5-flash-lite"
    job_requirements: Dict[str, Any]
    candidate_profile: Dict[str, Any]
    match_analysis: Dict[str, Any]
    tailored_content: Dict[str, Any]
    final_tailored_cv: Dict[str, Any]


class ExportPdfRequest(BaseModel):
    tailored_cv: Dict[str, Any]
