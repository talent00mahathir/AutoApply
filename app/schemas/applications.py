"""Pydantic schemas for Job Application tracking and database persistence."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class SaveApplicationRequest(BaseModel):
    """Payload to save an analyzed application and its generated contents into MySQL."""
    job_title: str
    company_name: str
    job_description: Optional[str] = None
    match_score: int = 0
    status: str = "Applied"

    # Application Content
    professional_summary: Optional[str] = None
    categorized_skills: Optional[Dict[str, Any]] = None
    tailored_bullets: Optional[List[Any]] = None
    cover_letter: Optional[str] = None
    matching_skills: Optional[List[Any]] = None
    missing_skills: Optional[List[Any]] = None
    gap_summary: Optional[str] = None
    interview_tips: Optional[List[Any]] = None
    final_tailored_cv: Optional[Dict[str, Any]] = None


class ApplicationSummaryResponse(BaseModel):
    """Summary item for application list display."""
    id: int
    job_title: str
    company_name: str
    match_score: int
    status: str
    applied_date: str
    created_at: str


class ApplicationDetailResponse(BaseModel):
    """Full detail of an application and its associated content."""
    id: int
    job_title: str
    company_name: str
    job_description: Optional[str] = None
    match_score: int
    status: str
    applied_date: str
    created_at: str
    content: Optional[Dict[str, Any]] = None


class UpdateStatusRequest(BaseModel):
    """Payload to update the lifecycle status of a tracked application."""
    status: str

