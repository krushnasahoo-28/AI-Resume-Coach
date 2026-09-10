# AI Resume Analyzer & Interview Coach

An enterprise-grade, production-quality SaaS web application engineered for Computer Science, Software Engineering, and AI candidates. The platform enables users to evaluate their resumes against ATS filters, identify technical skill gaps, match against real job postings, practice AI-moderated mock interviews, and visualize career readiness analytics.

---

## 🌟 Key Features

- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing.
- **Resume Upload & Parsing**: Support for multi-page PDF and DOCX resume parsing using PyMuPDF and `python-docx`.
- **ATS Compatibility Scoring**: AI-driven ATS evaluation scoring resumes for structural integrity, keywords, and readability.
- **Skill Extraction & Gap Analysis**: spaCy and NLP-assisted technical skill extraction with job-role comparative analysis.
- **AI Job Matching**: Vector similarity / scikit-learn matching between resumes and candidate target roles.
- **Interactive AI Mock Interviews**: Dynamic interview session generation with real-time answer evaluation.
- **Analytics Dashboard**: Interactive Recharts visualization tracking ATS scores, skill mastery, and interview performance over time.

---

## 🏗️ System Architecture

```text
ai-resume-coach/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── main.py           # FastAPI entry point & CORS configuration
│   │   ├── config.py         # Pydantic Settings & Environment loader
│   │   ├── database.py       # SQLAlchemy engine & PostgreSQL connection
│   │   ├── dependencies.py   # FastAPI dependency injection (get_db)
│   │   ├── api/              # API Route handlers (auth, resume, analysis, skills, jobs, interview)
│   │   ├── models/           # SQLAlchemy ORM database models
│   │   ├── schemas/          # Pydantic request/response validation schemas
│   │   ├── services/         # Core NLP, ATS, and interview AI engines
│   │   └── utils/            # Helper utilities and security functions
│   └── requirements.txt      # Python backend dependencies
│
├── frontend/                 # React / Vite Single Page Application
│   ├── src/
│   │   ├── components/       # Header, Footer, Cards, Badges, Charts
│   │   ├── pages/            # LandingPage, Dashboard, Analyzer, SkillGap, MockInterview
│   │   ├── services/         # Axios API client & endpoints integration
│   │   ├── hooks/            # Custom React hooks
│   │   ├── context/          # React Auth Context & global state
│   │   ├── App.jsx           # Root App router component
│   │   └── main.jsx          # React DOM entry
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite bundler configuration
│
├── data/
│   └── jobs.json             # Seed job dataset for role matching
│
├── docker-compose.yml        # Local PostgreSQL database orchestration
├── .env.example              # Environment variables template
└── README.md                 # Complete system documentation
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **HTTP Client**: Axios
- **Routing**: React Router v6

### Backend
- **Framework**: Python 3.10+ / FastAPI
- **Database ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL 16 (SQLite fallback supported for light local dev)
- **Validation**: Pydantic v2 & Pydantic-Settings
- **Server**: Uvicorn

### AI & NLP Pipeline
- **PDF Extraction**: PyMuPDF (`fitz`)
- **DOCX Extraction**: `python-docx`
- **NLP / Skill Matching**: spaCy, scikit-learn, sentence-transformers

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js (v18+) and `npm`
- Python 3.10+ and `pip`
- (Optional) Docker Desktop for PostgreSQL

---

### Step 1: Clone Repository & Configure Environment

```bash
cp .env.example .env
```

---

### Step 2: Set Up Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # Windows PowerShell:
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # Linux / macOS:
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start backend server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   The backend API is accessible at `http://localhost:8000`.
   Interactive API Swagger documentation is at `http://localhost:8000/docs`.
   Health check endpoint is at `http://localhost:8000/health`.

---

### Step 3: Set Up Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start frontend dev server:
   ```bash
   npm run dev
   ```
   The application UI will run at `http://localhost:5173`.

---

### Step 4: Database Setup (PostgreSQL with Docker)

To run local PostgreSQL instance via Docker Compose:

```bash
docker-compose up -d postgres
```

The database connection string in `.env` is configured as:
`DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_resume_coach`

---

## 📡 API Documentation & Core Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Production health check (`{"status": "healthy"}`) |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Log in and receive JWT access token |
| `POST` | `/api/resumes/upload` | Upload PDF/DOCX resume file |
| `GET` | `/api/analysis/{resume_id}` | Retrieve ATS & skill analysis for resume |
| `POST` | `/api/jobs/match` | Perform resume skill gap & job matching analysis |
| `POST` | `/api/interviews/session` | Create new mock interview practice session |

---

## 🧪 Testing

### Backend Health Check Verification
```bash
curl http://localhost:8000/health
# Response: {"status": "healthy"}
```

---

## ☁️ Deployment Instructions

1. **Stateless Backend Deployment**: Render / Railway / AWS App Runner using `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
2. **Managed PostgreSQL**: Supabase / Neon / AWS RDS PostgreSQL. Set `DATABASE_URL` environment variable.
3. **Frontend Deployment**: Vercel / Netlify / Cloudflare Pages. Set `VITE_API_BASE_URL` to point to production backend API domain.

---

## 🛣️ Roadmap & Future Improvements

- [ ] Add PDF highlighting for resume improvement suggestions.
- [ ] Voice-enabled real-time audio mock interviews.
- [ ] Custom resume builder with ATS-friendly templates export.
