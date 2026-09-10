import logging
from fastapi import FastAPI, APIRouter, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import User, Resume, ResumeAnalysis, SkillGap, Job, ResumeImprovement, Interview
from app.api import auth, resume, analysis, skills, jobs, improver, interviews, dashboard

logger = logging.getLogger(__name__)

# Initialize database tables on startup
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created successfully.")
    
    # Auto-seed job dataset if empty
    with SessionLocal() as session:
        jobs.seed_jobs_if_empty(session)
except Exception as e:
    logger.error(f"Error initializing database tables: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production AI Resume Analyzer & Mock Interview Coach API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/health", tags=["Health"])
def health_check():
    """
    State-check health endpoint for production deployments and monitoring.
    """
    return {"status": "healthy"}

@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "health": "/health"
    }

# API Router setup
api_router = APIRouter(prefix=settings.API_V1_STR)

@api_router.get("/status", tags=["Status"])
def api_status():
    return {"api_version": "v1", "status": "active"}

# Mount Auth, Resume, Analysis, Skills, Jobs, Improver, Interviews & Dashboard routers
api_router.include_router(auth.router)
api_router.include_router(resume.router)
api_router.include_router(analysis.router)
api_router.include_router(skills.router)
api_router.include_router(jobs.router)
api_router.include_router(improver.router)
api_router.include_router(interviews.router)
api_router.include_router(dashboard.router)

# Also support POST/GET /api/resume/improve/{resume_id} as alias
@api_router.post("/resume/improve/{resume_id}", tags=["Resume Improvement"])
def post_resume_improve_alias(resume_id: int, current_user: User = Depends(improver.get_current_user), db: Session = Depends(improver.get_db)):
    return improver.generate_resume_improvements(resume_id, current_user, db)

@api_router.get("/resume/improve/{resume_id}", tags=["Resume Improvement"])
def get_resume_improve_alias(resume_id: int, current_user: User = Depends(improver.get_current_user), db: Session = Depends(improver.get_db)):
    return improver.get_resume_improvements(resume_id, current_user, db)

app.include_router(api_router)
