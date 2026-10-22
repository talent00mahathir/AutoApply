# AutoApply

**Autonomous Multi-Agent AI Job Application Assistant**

AutoApply is an autonomous multi-agent platform designed to analyze job postings, parse candidate resumes, calculate semantic ATS compatibility, generate quantified application assets using Google's XYZ formula, and compile single-column ATS-compliant resumes.

## Project Scope & Objectives

- **Backend:** FastAPI (Python 3.10+)
- **AI Orchestration:** Google Agent Development Kit (ADK) & Gemini Models
- **Database:** SQLAlchemy ORM (MySQL with SQLite local development fallback)
- **Document Engine:** Typst ATS Typesetting Engine
- **Frontend:** Single Page Application (HTML5, Tailwind CSS, Vanilla JS)

## Initial Setup & Dependencies

1. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```

2. Activate virtual environment:
   ```powershell
   # Windows (PowerShell):
   .\.venv\Scripts\Activate.ps1

   # Linux / macOS:
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   copy .env.example .env
   ```

## Development Roadmap

- [x] Initial repository structure and dependency specification
- [ ] Database modeling & ORM configuration
- [ ] 4-Agent sequential pipeline integration (Google ADK)
- [ ] ATS resume typesetting engine
- [ ] Frontend web studio & live in-browser editor
- [ ] Automated verification suite

*Complete architectural blueprints, API reference, and test suite verification will be published upon the v1.0.0 release.*

---

## 📄 License

Released under the **MIT License**. Copyright © 2026 AutoApply Team.
