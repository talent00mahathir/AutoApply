"""Dashboard Router: Aggregate statistics, match score metrics, and quick dashboard insights."""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import User, Application
from app.dependencies import get_optional_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieve summarized statistics for dashboard visualization:
    - Total applications count
    - Average ATS match score
    - Status breakdown counts (Saved, Applied, Interview, Offer, Rejected)
    - Score distribution buckets for charts
    - 5 most recent applications
    """
    if not current_user:
        return {
            "total_applications": 0,
            "average_match_score": 0,
            "status_counts": {
                "Saved": 0,
                "Applied": 0,
                "Interview": 0,
                "Offer": 0,
                "Rejected": 0
            },
            "score_distribution": {
                "90-100": 0,
                "75-89": 0,
                "50-74": 0,
                "<50": 0
            },
            "recent_applications": []
        }

    apps = (
        db.query(Application)
        .filter(Application.user_id == current_user.id)
        .order_by(Application.created_at.desc())
        .all()
    )

    total_apps = len(apps)
    avg_score = round(sum(a.match_score for a in apps) / total_apps, 1) if total_apps > 0 else 0

    status_counts = {
        "Saved": 0,
        "Applied": 0,
        "Interview": 0,
        "Offer": 0,
        "Rejected": 0
    }
    score_distribution = {
        "90-100": 0,
        "75-89": 0,
        "50-74": 0,
        "<50": 0
    }

    for app in apps:
        status_key = app.status.strip().title() if app.status else "Applied"
        if status_key in status_counts:
            status_counts[status_key] += 1
        else:
            status_counts[status_key] = 1

        score = app.match_score or 0
        if score >= 90:
            score_distribution["90-100"] += 1
        elif score >= 75:
            score_distribution["75-89"] += 1
        elif score >= 50:
            score_distribution["50-74"] += 1
        else:
            score_distribution["<50"] += 1

    recent = [
        {
            "id": a.id,
            "job_title": a.job_title,
            "company_name": a.company_name,
            "match_score": a.match_score,
            "status": a.status,
            "applied_date": a.applied_date.strftime("%Y-%m-%d %H:%M")
        }
        for a in apps[:5]
    ]

    return {
        "total_applications": total_apps,
        "average_match_score": avg_score,
        "status_counts": status_counts,
        "score_distribution": score_distribution,
        "recent_applications": recent
    }
