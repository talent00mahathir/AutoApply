"""Applications Router: Track, retrieve, and manage saved applications in MySQL."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import User, Application, ApplicationContent
from app.dependencies import get_current_user
from app.schemas.applications import (
    SaveApplicationRequest,
    ApplicationSummaryResponse,
    ApplicationDetailResponse,
    UpdateStatusRequest
)

router = APIRouter(prefix="/api/applications", tags=["Applications Tracker"])


@router.post("", status_code=status.HTTP_201_CREATED)
def save_application(
    request: SaveApplicationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save an analyzed job application and its tailored materials to the MySQL database."""
    app_record = Application(
        user_id=current_user.id,
        job_title=request.job_title,
        company_name=request.company_name,
        job_description=request.job_description,
        match_score=request.match_score,
        status=request.status or "Applied"
    )
    db.add(app_record)
    db.flush()  # Obtain app_record.id

    content_record = ApplicationContent(
        application_id=app_record.id,
        professional_summary=request.professional_summary,
        categorized_skills=request.categorized_skills,
        tailored_bullets=request.tailored_bullets,
        cover_letter=request.cover_letter,
        matching_skills=request.matching_skills,
        missing_skills=request.missing_skills,
        gap_summary=request.gap_summary,
        interview_tips=request.interview_tips,
        final_tailored_cv=request.final_tailored_cv
    )
    db.add(content_record)
    db.commit()
    db.refresh(app_record)

    return {
        "success": True,
        "message": "Application saved to database successfully.",
        "application_id": app_record.id,
        "job_title": app_record.job_title,
        "company_name": app_record.company_name
    }


@router.get("", response_model=List[ApplicationSummaryResponse])
def get_user_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
):
    """Retrieve all job applications tracked by the authenticated user."""
    # FE-8: cap page to avoid unbounded payloads. Clamp sane bounds.
    limit = max(1, min(limit, 200))
    offset = max(0, offset)
    apps = (
        db.query(Application)
        .filter(Application.user_id == current_user.id)
        .order_by(Application.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    return [
        ApplicationSummaryResponse(
            id=app.id,
            job_title=app.job_title,
            company_name=app.company_name,
            match_score=app.match_score,
            status=app.status,
            applied_date=app.applied_date.strftime("%Y-%m-%d %H:%M"),
            created_at=app.created_at.strftime("%Y-%m-%d %H:%M")
        )
        for app in apps
    ]


@router.get("/{application_id}", response_model=ApplicationDetailResponse)
def get_application_detail(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full details and tailored materials for a specific application."""
    app_record = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if not app_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found or unauthorized access."
        )

    content_data = None
    if app_record.content:
        c = app_record.content
        content_data = {
            "professional_summary": c.professional_summary,
            "categorized_skills": c.categorized_skills,
            "tailored_bullets": c.tailored_bullets,
            "cover_letter": c.cover_letter,
            "matching_skills": c.matching_skills,
            "missing_skills": c.missing_skills,
            "gap_summary": c.gap_summary,
            "interview_tips": c.interview_tips,
            "final_tailored_cv": c.final_tailored_cv
        }

    return ApplicationDetailResponse(
        id=app_record.id,
        job_title=app_record.job_title,
        company_name=app_record.company_name,
        job_description=app_record.job_description,
        match_score=app_record.match_score,
        status=app_record.status,
        applied_date=app_record.applied_date.strftime("%Y-%m-%d %H:%M"),
        created_at=app_record.created_at.strftime("%Y-%m-%d %H:%M"),
        content=content_data
    )


@router.delete("/{application_id}")
def delete_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a saved application and its associated content."""
    app_record = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if not app_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found or unauthorized access."
        )

    db.delete(app_record)
    db.commit()
    return {"success": True, "message": "Application deleted successfully."}


ALLOWED_STATUSES = {"Saved", "Applied", "Interview", "Offer", "Rejected"}


@router.patch("/{application_id}/status")
def update_application_status(
    application_id: int,
    request: UpdateStatusRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the status of an application (e.g. Applied -> Interview -> Offer -> Rejected)."""
    normalized_status = request.status.strip().title()
    if normalized_status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{request.status}'. Allowed statuses: {sorted(list(ALLOWED_STATUSES))}"
        )

    app_record = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if not app_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found or unauthorized access."
        )

    app_record.status = normalized_status
    db.commit()
    return {"success": True, "status": app_record.status}

