"""PDF Ingestion and Generation Service.

- Ingestion: Extracts clean text from uploaded PDF resumes using pypdf with security guards.
- Generation: Compiles tailored CV data into a global tech FAANG-grade (Jake's Resume style),
  ATS-optimized PDF resume using Typst (with automatic ReportLab fallback).
"""

import io
import os
import re
import logging
from typing import Any, Dict, List, Optional
import pypdf
import jinja2
import typst
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    Table,
    TableStyle
)

logger = logging.getLogger("autoapply.pdf_service")

MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_PDF_PAGES = 15  # Defense against PDF decompression bombs



# =====================================================================
# 1. PDF TEXT EXTRACTION (INGESTION WITH SECURITY GUARDS)
# =====================================================================
def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract and sanitize raw text from an uploaded PDF resume.

    Security Validations:
    - Verifies %PDF- binary header (magic bytes) to reject spoofed/malicious extensions.
    - Clamps maximum file size to 5 MB.
    - Limits page inspection to 15 pages to defend against decompression bombs.

    Args:
        pdf_bytes: Raw binary bytes of the PDF file.

    Returns:
        Clean, extracted string text.

    Raises:
        ValueError: If PDF is invalid, corrupt, oversized, or contains no extractable text.
    """
    if not pdf_bytes:
        raise ValueError("Uploaded PDF file is empty.")

    if len(pdf_bytes) > MAX_PDF_SIZE_BYTES:
        raise ValueError(f"Uploaded file exceeds the maximum allowed size of {MAX_PDF_SIZE_BYTES // (1024 * 1024)} MB.")

    # Validate PDF Magic Bytes in the header window (first 1024 bytes)
    header_window = pdf_bytes[:1024]
    if b"%PDF-" not in header_window:
        raise ValueError(
            "Invalid file format: Missing '%PDF-' binary signature. "
            "The uploaded file is not a genuine PDF document."
        )

    try:
        stream = io.BytesIO(pdf_bytes)
        reader = pypdf.PdfReader(stream)

        # Enforce page limit defense
        total_pages = len(reader.pages)
        if total_pages > MAX_PDF_PAGES:
            raise ValueError(
                f"PDF exceeds the maximum allowable page count ({total_pages} pages detected, limit is {MAX_PDF_PAGES})."
            )

        text_chunks: List[str] = []
        for page_num, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_chunks.append(page_text.strip())

        full_text = "\n\n".join(text_chunks).strip()

        if not full_text:
            raise ValueError(
                "Could not extract text from this PDF. It may contain scanned images without OCR."
            )

        # Normalize excessive newlines and spaces
        cleaned = re.sub(r"\n{3,}", "\n\n", full_text)
        return cleaned

    except Exception as e:
        if isinstance(e, ValueError):
            raise
        raise ValueError(f"Failed to parse PDF resume: {str(e)}")



# =====================================================================
# 2. TYPST FAANG ATS-ENGINEERED RESUME GENERATOR
# =====================================================================
def escape_typst(text: Any) -> str:
    """Escape special Typst markup characters to prevent compilation errors."""
    if not isinstance(text, str):
        return str(text) if text is not None else ""
    text = text.replace('\\', '\\\\')
    for ch in ['@', '#', '$', '<', '>', '[', ']', '`']:
        text = text.replace(ch, f'\\{ch}')
    return text


TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")
_jinja_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(TEMPLATES_DIR),
    autoescape=False
)
_jinja_env.filters["escape_typst"] = escape_typst


def generate_typst_resume_pdf(cv_data: Dict[str, Any]) -> bytes:
    """Compile tailored CV data into a FAANG-grade (Jake's Resume style) ATS PDF using Typst.

    Compiles cleanly in memory (~50ms) with publication-quality typography.
    """
    contact = cv_data.get("contact_info", {})
    template_data = {
        "name": contact.get("name", "Applicant Name"),
        "phone": contact.get("phone", ""),
        "email": contact.get("email", ""),
        "address": contact.get("location") or contact.get("address", ""),
        "linkedin": contact.get("linkedin_url", ""),
        "github": contact.get("github_url", ""),
        "summary": cv_data.get("professional_summary", "").strip(),
        "skills": cv_data.get("categorized_skills", {}),
        "projects": cv_data.get("tailored_projects", []),
        "experience": cv_data.get("experience", []),
        "education": cv_data.get("education", []),
        "references": cv_data.get("references", [])
    }

    template = _jinja_env.get_template("resume_faang.typ.j2")
    rendered_typst = template.render(**template_data)
    pdf_bytes = typst.compile(rendered_typst.encode("utf-8"))
    return pdf_bytes


# =====================================================================
# 3. REPORTLAB BACKUP GENERATOR (RESILIENT FALLBACK)
# =====================================================================
def generate_reportlab_resume_pdf(cv_data: Dict[str, Any]) -> bytes:
    """Generate a clean, ATS-compliant single/multi-page PDF resume using ReportLab.


    Args:
        cv_data: Structured CV dictionary containing:
            - contact_info (name, email, phone, location, linkedin_url, github_url)
            - professional_summary
            - categorized_skills (Languages, Frameworks, Tools)
            - tailored_projects (project_name, project_role, technologies, xyz_bullets)
            - education (degree, institution, grade, period)
            - references (optional)

    Returns:
        Raw PDF file bytes.
    """
    buffer = io.BytesIO()

    # Document geometry: Letter, 0.5 in margins (clean ATS format)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom Typography Styles
    name_style = ParagraphStyle(
        "ResumeName",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        alignment=1,  # Centered
        textColor=colors.HexColor("#111827")
    )

    contact_style = ParagraphStyle(
        "ResumeContact",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        alignment=1,  # Centered
        textColor=colors.HexColor("#4B5563")
    )

    heading_style = ParagraphStyle(
        "ResumeHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#1F2937"),
        spaceBefore=8,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        "ResumeBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor("#374151")
    )

    item_title_style = ParagraphStyle(
        "ResumeItemTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#111827")
    )

    item_subtitle_style = ParagraphStyle(
        "ResumeItemSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#4B5563")
    )

    bullet_style = ParagraphStyle(
        "ResumeBullet",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.5,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=2,
        textColor=colors.HexColor("#1F2937")
    )

    elements = []

    # -------------------------------------------------------------
    # 1. HEADER & CONTACT INFO
    # -------------------------------------------------------------
    contact = cv_data.get("contact_info", {})
    name = contact.get("name", "Applicant Name").upper()
    elements.append(Paragraph(name, name_style))
    elements.append(Spacer(1, 3))

    contact_parts = []
    if contact.get("phone"):
        contact_parts.append(contact["phone"])
    if contact.get("email"):
        contact_parts.append(contact["email"])
    if contact.get("address"):
        contact_parts.append(contact["address"])
    if contact.get("linkedin_url"):
        contact_parts.append(contact["linkedin_url"])
    if contact.get("github_url"):
        contact_parts.append(contact["github_url"])

    contact_line = " | ".join(contact_parts)
    elements.append(Paragraph(contact_line, contact_style))
    elements.append(Spacer(1, 6))

    def add_section_divider(title: str):
        elements.append(Paragraph(title.upper(), heading_style))
        elements.append(
            HRFlowable(
                width="100%",
                thickness=0.75,
                color=colors.HexColor("#9CA3AF"),
                spaceBefore=1,
                spaceAfter=4
            )
        )

    # -------------------------------------------------------------
    # 2. PROFESSIONAL SUMMARY
    # -------------------------------------------------------------
    summary = cv_data.get("professional_summary", "").strip()
    if summary:
        add_section_divider("Professional Summary")
        elements.append(Paragraph(summary, body_style))
        elements.append(Spacer(1, 4))

    # -------------------------------------------------------------
    # 3. TECHNICAL SKILLS
    # -------------------------------------------------------------
    skills = cv_data.get("categorized_skills", {})
    if skills and isinstance(skills, dict):
        add_section_divider("Technical Skills")
        for category, skill_list in skills.items():
            if skill_list and isinstance(skill_list, list):
                cat_name = category.replace("_", " ").title()
                line = f"<b>{cat_name}:</b> {', '.join(skill_list)}"
                elements.append(Paragraph(line, body_style))
        elements.append(Spacer(1, 4))

    # -------------------------------------------------------------
    # 4. TAILORED PROJECTS (GOOGLE XYZ BULLETS)
    # -------------------------------------------------------------
    projects = cv_data.get("tailored_projects", [])
    if projects and isinstance(projects, list):
        add_section_divider("Technical Projects")
        for p in projects:
            p_name = p.get("project_name", "Project Title")
            p_role = p.get("project_role", "")
            p_tech = ", ".join(p.get("technologies", []))

            role_str = f" &bull; <i>{p_role}</i>" if p_role else ""
            tech_str = f" | [{p_tech}]" if p_tech else ""

            header_html = f"<b>{p_name}</b>{role_str}{tech_str}"
            elements.append(Paragraph(header_html, item_title_style))

            for bullet in p.get("xyz_bullets", []):
                elements.append(Paragraph(f"&bull;&nbsp;&nbsp;{bullet}", bullet_style))
            elements.append(Spacer(1, 3))

    # -------------------------------------------------------------
    # 5. EDUCATION
    # -------------------------------------------------------------
    education = cv_data.get("education", [])
    if education and isinstance(education, list):
        add_section_divider("Education")
        for edu in education:
            deg = edu.get("degree", "")
            inst = edu.get("institution", "")
            grade = edu.get("grade", "")
            period = edu.get("period", "")

            left_text = f"<b>{deg}</b> — {inst}"
            right_text = f"{grade} | {period}" if grade and period else (grade or period)
            edu_html = f"{left_text}<br/><font color='#4B5563' size='8'>{right_text}</font>"
            elements.append(Paragraph(edu_html, body_style))
            elements.append(Spacer(1, 2))

    # -------------------------------------------------------------
    # 6. REFERENCES (OPTIONAL)
    # -------------------------------------------------------------
    references = cv_data.get("references", [])
    if references and isinstance(references, list):
        add_section_divider("References")
        for ref in references:
            ref_name = ref.get("name", "")
            desig = ref.get("designation", "")
            inst = ref.get("institution", "")
            email = ref.get("email", "")
            ref_html = f"<b>{ref_name}</b>, {desig}, {inst} (<i>{email}</i>)"
            elements.append(Paragraph(ref_html, body_style))

    # Build the document
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


# =====================================================================
# 4. MASTER EXPORT ENTRYPOINT WITH AUTOMATIC FALLBACK
# =====================================================================
def generate_tailored_resume_pdf(cv_data: Dict[str, Any]) -> bytes:
    """Compile an ATS-compliant tailored resume.

    Primary Engine: Typst FAANG-Grade (Jake's Resume style) compiler (~50ms).
    Resilient Fallback: ReportLab PDF builder if Typst encounters any unexpected exception.

    Args:
        cv_data: Structured CV dictionary.

    Returns:
        Raw PDF file bytes.
    """
    try:
        pdf_bytes = generate_typst_resume_pdf(cv_data)
        logger.info("Successfully generated FAANG-grade resume via Typst engine.")
        return pdf_bytes
    except Exception as exc:
        logger.warning(
            f"Typst compilation encountered an issue: {exc}. "
            "Seamlessly falling back to ReportLab engine.",
            exc_info=True
        )
        return generate_reportlab_resume_pdf(cv_data)

