"""SQLAlchemy ORM Models for AutoApply: User, Application, and ApplicationContent."""

from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    JSON
)
from sqlalchemy.orm import relationship

from app.database.connection import Base


class User(Base):
    """User account entity for authentication and data ownership."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    applications = relationship(
        "Application",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(Application.created_at)"
    )

    def __repr__(self):
        return f"<User id={self.id} email='{self.email}'>"


class Application(Base):
    """Job application tracked by a user."""
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    job_title = Column(String(150), nullable=False)
    company_name = Column(String(150), nullable=False)
    job_description = Column(Text, nullable=True)
    match_score = Column(Integer, default=0, nullable=False)  # 0 to 100
    status = Column(
        String(50),
        default="Applied",
        nullable=False
    )  # Applied, Interview, Offer, Rejected

    applied_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="applications")
    content = relationship(
        "ApplicationContent",
        back_populates="application",
        uselist=False,
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Application id={self.id} role='{self.job_title}' company='{self.company_name}' status='{self.status}'>"


class ApplicationContent(Base):
    """AI-generated and user-edited tailored application materials."""
    __tablename__ = "application_contents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    application_id = Column(
        Integer,
        ForeignKey("applications.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )

    # AI Tailored Outputs (stored as JSON arrays or strings)
    professional_summary = Column(Text, nullable=True)  # Targeted 3rd-person executive summary
    categorized_skills = Column(JSON, nullable=True)    # Languages, Frameworks, Tools
    tailored_bullets = Column(JSON, nullable=True)      # Legacy / flat bullet points
    cover_letter = Column(Text, nullable=True)          # Customized cover letter
    matching_skills = Column(JSON, nullable=True)       # Skills overlapping
    missing_skills = Column(JSON, nullable=True)        # Gap skills
    gap_summary = Column(Text, nullable=True)           # Narrative gap explanation
    interview_tips = Column(JSON, nullable=True)        # Custom interview prep points
    final_tailored_cv = Column(JSON, nullable=True)     # Full structured ATS CV object

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    application = relationship("Application", back_populates="content")

    def __repr__(self):
        return f"<ApplicationContent id={self.id} application_id={self.application_id}>"
