**Bangladesh University of Professionals**
**Department of Computer Science and Engineering**

**CSE 3208: Software Development Project I**
**Project Proposal Report**

# AutoApply: An Agentic AI Assistant for Job and Internship Applications

**Group No:** 10

**Submitted by**

| Name | Student ID |
|---|---|
| Ahmad Ibrahim Nahian | 24524203065 |
| Mahathir Mohammad | 24524203179 |
| MD Akimo Islam Sad | 24524203135 |
| MD Hasibul Hasan Rafi | 23524202003 |

---

## 1. Project Title

AutoApply: An Agentic AI Assistant for Job and Internship Applications

---

## 2. Problem Statement

Students spend a lot of time rewriting resumes and cover letters for each job they apply to. They also have no easy way to check how well their profile matches a job, or to track the status of applications they have already sent.

As a result, students either send the same generic resume everywhere or lose hours tailoring each application by hand. After applying, they usually have no organized record of which jobs they applied to, when, and what happened next.

---

## 3. Target Users

University students and fresh graduates applying for jobs or internships.

| User | Need |
|---|---|
| Student / Job seeker (primary user) | Quickly tailor a resume and cover letter to a job, see how well they match, and track all applications in one place |

There is no separate admin role in the current scope. The system is built for individual use.

---

## 4. Project Objectives

- Extract key requirements and skills from a job posting.
- Extract skills, experience, and education from a resume.
- Compare the two and generate a match score with a list of missing skills.
- Generate tailored resume bullet points and a cover letter.
- Provide a dashboard to track submitted applications.

---

## 5. Major Features and Functionalities

| # | Feature | Description |
|---|---|---|
| 1 | Register / Login | User creates an account and logs in to access their own data |
| 2 | Job Posting Input | Paste job description as text |
| 3 | Resume Upload | Upload resume as PDF, parsed into text |
| 4 | Requirement Extraction | Pulls required skills from the job posting |
| 5 | Resume Matching | Compares resume with job, gives match score and gap list |
| 6 | Tailored Content Generation | Generates resume bullets and cover letter, editable by user |
| 7 | Application Tracker | Table of applications with job title, company, date, and status |

---

## 6. Proposed Technology Stack

| Component | Technology |
|---|---|
| Backend | FastAPI (Python) |
| Database | MySQL |
| ORM | SQLAlchemy |
| Frontend | HTML, CSS, JavaScript |
| AI Agent Orchestration | Google ADK |
| LLM | Gemini / Grok |
| PDF Parsing | pypdf |

---

## 7. Basic System Workflow

User pastes a job description and uploads a resume. Four AI agents run in sequence: Agent 1 extracts job requirements, Agent 2 extracts resume details, Agent 3 compares both and produces a match score and gap list, Agent 4 generates tailored resume bullets and a cover letter. The user reviews and edits the output, then saves it to the application tracker.

### 7.1 The Four Agents

| Agent | Role | Input | Output |
|---|---|---|---|
| Agent 1: Job Parser | Reads the job posting | Job description text | Job title, required skills, responsibilities |
| Agent 2: Resume Analyzer | Reads the resume | Resume text | Skills, experience, education |
| Agent 3: Matcher | Compares job and resume | Output of Agent 1 and Agent 2 | Match score (0-100), missing skills |
| Agent 4: Writer | Writes tailored content | Output of Agents 1, 2 and 3 | Resume bullet points, cover letter |

Each agent saves its result in a shared session state. The next agent reads that state and continues.

### 7.2 Flow

```
User
  |  pastes job description + uploads resume (PDF)
  v
Web Application (HTML / CSS / JavaScript)
  |
  v
FastAPI Backend  --- extracts text from PDF
  |
  v
Agent Pipeline (Google ADK)
  Agent 1: Job Parser        --> job requirements
  Agent 2: Resume Analyzer   --> resume data
  Agent 3: Matcher           --> match score + missing skills
  Agent 4: Writer            --> resume bullets + cover letter
  |
  v
Results page: score, gaps, editable bullets and cover letter
  |
  v
User reviews / edits --> Save --> Application Tracker (MySQL)
```

### 7.3 Main Screens

| Screen | What the user sees |
|---|---|
| Input page | Text box for job description, PDF upload button, Analyze button |
| Results page | Match score, missing skills, editable resume bullets, editable cover letter, Save to Tracker button |
| Tracker page | Table with job title, company, date applied, status (Applied / Interview / Offer / Rejected) |

---

## 8. Uniqueness and Significance

Most resume tools use one AI prompt to do everything. This project uses four separate agents, each handling one task and passing its output to the next. This gives more structured and reliable results, and reflects real agentic AI design instead of a single-prompt wrapper.

It also combines three things students normally do in separate places: checking job fit, tailoring application content, and tracking applications.

---

## 9. Feasibility and Project Scope

Live scraping of job sites is unreliable due to bot blocking and changing page layouts, so job descriptions will be entered as text instead of fetched from a live link. This keeps the scope safe. Resume parsing, the four-agent pipeline, and the tracker are all achievable within one semester using FastAPI and Google ADK.

### 9.1 In Scope

- User registration and login
- Job description input as text
- Resume upload as PDF and text extraction
- Four-agent pipeline (parse job, analyze resume, match, write)
- Editable tailored resume bullets and cover letter
- Application tracker with status updates

### 9.2 Out of Scope

- Live scraping of LinkedIn, Indeed or other job sites
- Automatic submission of applications to job portals
- Mobile application

### 9.3 Risks and Mitigation

| Risk | Mitigation |
|---|---|
| AI output may be inaccurate or badly formatted | Each agent returns structured JSON; the user can review and edit all content before saving |
| LLM service may be slow or unavailable | Show a clear error message instead of crashing |
| Resume data is personal | Keep each user's data private; require login to access it |

### 9.4 Development Model

The project follows the Agile model. Each agent is built and tested one at a time, then chained into the full pipeline, and the backend, frontend and tracker are added in stages.

---

## 10. Expected Outcome

A working web application where a student submits a job posting and resume, and receives a match score, a gap analysis, tailored resume and cover letter content, and an application tracker to manage all submitted applications.

---

## 11. Future Scope

- Real job-board API integration
- Browser extension for one-click use on job pages
- Multi-language resume support
