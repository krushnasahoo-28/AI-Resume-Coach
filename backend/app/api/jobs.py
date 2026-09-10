import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.schemas.job import JobMatchRequest, JobMatchResult, JobMatchResponse
from app.dependencies import get_current_user
from app.services.job_matcher import calculate_job_match

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/jobs", tags=["Job Matching"])

# 30+ Realistic Demo Software Job Postings
SAMPLE_JOBS_SEED = [
    # 1-3. Software Engineer
    {
        "company": "TechCorp Solutions",
        "title": "Software Engineer - Core Platform",
        "location": "San Francisco, CA / Remote",
        "description": "Develop high-throughput scalable microservices, REST APIs, and database models using Python, FastAPI, and PostgreSQL.",
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "REST APIs", "Git"],
        "preferred_skills": ["Docker", "Redis", "System Design"],
        "experience": "Mid-Level (2-4 yrs)",
        "category": "Software Engineer"
    },
    {
        "company": "Nexus Systems",
        "title": "Junior Software Engineer",
        "location": "Austin, TX / Hybrid",
        "description": "Join our cloud infrastructure team building foundational web software, data structures, and continuous integration pipelines.",
        "required_skills": ["Java", "SQL", "Git", "Data Structures", "Algorithms"],
        "preferred_skills": ["Python", "Docker", "Linux"],
        "experience": "Junior (0-2 yrs)",
        "category": "Software Engineer"
    },
    {
        "company": "ScaleAI Labs",
        "title": "Senior Systems Software Engineer",
        "location": "New York, NY / Remote",
        "description": "Architect distributed systems, low-latency microservices, and containerized backend architectures for enterprise clients.",
        "required_skills": ["C++", "Python", "System Design", "Docker", "Linux"],
        "preferred_skills": ["Kubernetes", "gRPC", "AWS"],
        "experience": "Senior (5+ yrs)",
        "category": "Software Engineer"
    },

    # 4-6. Backend Developer
    {
        "company": "CloudStream",
        "title": "Backend Python / FastAPI Engineer",
        "location": "Remote",
        "description": "Design asynchronous REST APIs, manage PostgreSQL schema migrations, and optimize Redis caching layers.",
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "REST APIs"],
        "preferred_skills": ["Docker", "Asyncio", "Celery"],
        "experience": "Mid-Level (3-5 yrs)",
        "category": "Backend Developer"
    },
    {
        "company": "Enterprise Tech",
        "title": "Senior Java Backend Engineer",
        "location": "Chicago, IL / Hybrid",
        "description": "Build high-reliability financial microservices using Spring Boot, PostgreSQL, Kafka event streams, and Docker.",
        "required_skills": ["Java", "Spring Boot", "Microservices", "PostgreSQL", "Kafka"],
        "preferred_skills": ["Kubernetes", "Docker", "REST APIs"],
        "experience": "Senior (5+ yrs)",
        "category": "Backend Developer"
    },
    {
        "company": "DataHub Inc",
        "title": "Backend Engineer - Distributed Systems",
        "location": "Seattle, WA / Remote",
        "description": "Develop scalable NoSQL data ingestion backends using Python, MongoDB, Docker, and RESTful web services.",
        "required_skills": ["Python", "MongoDB", "REST APIs", "Docker", "Git"],
        "preferred_skills": ["FastAPI", "PostgreSQL", "AWS"],
        "experience": "Mid-Level (2-4 yrs)",
        "category": "Backend Developer"
    },

    # 7-9. Frontend Developer
    {
        "company": "PixelCraft UI",
        "title": "Frontend Developer (React / TypeScript)",
        "location": "San Jose, CA / Remote",
        "description": "Create responsive, accessible SaaS user interfaces using React, TypeScript, Tailwind CSS, and Vite.",
        "required_skills": ["React", "TypeScript", "JavaScript", "HTML5", "CSS3"],
        "preferred_skills": ["Tailwind CSS", "Redux", "Next.js"],
        "experience": "Mid-Level (2-4 yrs)",
        "category": "Frontend Developer"
    },
    {
        "company": "SaaSify",
        "title": "Senior Frontend Architect (Next.js)",
        "location": "Remote",
        "description": "Lead frontend architecture for our high-traffic dashboard, implementing server-side rendering, Redux state, and Tailwind CSS.",
        "required_skills": ["React", "TypeScript", "Next.js", "Tailwind CSS", "Redux"],
        "preferred_skills": ["REST APIs", "GraphQL", "Vite"],
        "experience": "Senior (5+ yrs)",
        "category": "Frontend Developer"
    },
    {
        "company": "CreativeApps",
        "title": "UI / UX Frontend Web Developer",
        "location": "Boston, MA / Hybrid",
        "description": "Build interactive single-page application interfaces integrated with REST API backend endpoints.",
        "required_skills": ["JavaScript", "React", "HTML5", "CSS3", "Git"],
        "preferred_skills": ["TypeScript", "Tailwind CSS", "REST APIs"],
        "experience": "Junior-Mid (1-3 yrs)",
        "category": "Frontend Developer"
    },

    # 10-12. Full Stack Developer
    {
        "company": "OmniStack Inc",
        "title": "Full Stack Engineer (React + Python)",
        "location": "Remote",
        "description": "Build end-to-end SaaS applications using React and TypeScript on the frontend, and Python FastAPI and PostgreSQL on the backend.",
        "required_skills": ["React", "TypeScript", "Python", "FastAPI", "PostgreSQL"],
        "preferred_skills": ["Docker", "Tailwind CSS", "Git"],
        "experience": "Mid-Level (3-5 yrs)",
        "category": "Full Stack Developer"
    },
    {
        "company": "StartupGen",
        "title": "Full Stack Developer (Node.js + React)",
        "location": "San Francisco, CA / Hybrid",
        "description": "Fast-paced startup looking for a Full Stack engineer to build interactive interfaces and Node.js REST APIs with MongoDB.",
        "required_skills": ["React", "JavaScript", "Node.js", "MongoDB", "REST APIs"],
        "preferred_skills": ["TypeScript", "Docker", "Express"],
        "experience": "Mid-Level (2-4 yrs)",
        "category": "Full Stack Developer"
    },
    {
        "company": "VentureApps",
        "title": "Senior Full Stack Architect",
        "location": "Remote",
        "description": "Architect enterprise cloud applications using React, Python, PostgreSQL, Docker, and AWS cloud infrastructure.",
        "required_skills": ["React", "Python", "PostgreSQL", "Docker", "AWS"],
        "preferred_skills": ["TypeScript", "FastAPI", "GraphQL"],
        "experience": "Senior (5+ yrs)",
        "category": "Full Stack Developer"
    },

    # 13-15. Python Developer
    {
        "company": "PyLogic Corp",
        "title": "Python Core Developer",
        "location": "Denver, CO / Remote",
        "description": "Write clean Python code for data processing engines, FastAPI microservices, and PostgreSQL database models.",
        "required_skills": ["Python", "FastAPI", "Django", "SQL", "PostgreSQL"],
        "preferred_skills": ["Pandas", "Asyncio", "Docker"],
        "experience": "Mid-Level (2-4 yrs)",
        "category": "Python Developer"
    },
    {
        "company": "DataAutomate",
        "title": "Python Automation & API Developer",
        "location": "Atlanta, GA / Remote",
        "description": "Build automated Python scripts, RESTful microservices, and background queue workers.",
        "required_skills": ["Python", "Flask", "SQL", "Git", "REST APIs"],
        "preferred_skills": ["Docker", "Pandas", "PostgreSQL"],
        "experience": "Junior-Mid (1-3 yrs)",
        "category": "Python Developer"
    },
    {
        "company": "FinPy Systems",
        "title": "Senior Python Systems Engineer",
        "location": "New York, NY / Hybrid",
        "description": "Develop high-performance financial data engines in Python using Pandas, NumPy, PostgreSQL, and Docker.",
        "required_skills": ["Python", "Pandas", "NumPy", "PostgreSQL", "Docker"],
        "preferred_skills": ["FastAPI", "Redis", "Asyncio"],
        "experience": "Senior (5+ yrs)",
        "category": "Python Developer"
    },

    # 16-18. Java Developer
    {
        "company": "Fintech Global",
        "title": "Java Spring Boot Developer",
        "location": "Charlotte, NC / Hybrid",
        "description": "Develop enterprise banking microservices using Java 17, Spring Boot, Hibernate, and PostgreSQL.",
        "required_skills": ["Java", "Spring Boot", "Hibernate", "PostgreSQL", "REST APIs"],
        "preferred_skills": ["Docker", "Maven", "JUnit"],
        "experience": "Mid-Level (3-5 yrs)",
        "category": "Java Developer"
    },
    {
        "company": "LegacyCloud",
        "title": "Senior Java Microservices Engineer",
        "location": "Remote",
        "description": "Architect distributed messaging systems using Java, Spring Boot, Kafka, MySQL, and Docker.",
        "required_skills": ["Java", "Spring Boot", "Microservices", "Kafka", "MySQL"],
        "preferred_skills": ["Kubernetes", "Docker", "AWS"],
        "experience": "Senior (5+ yrs)",
        "category": "Java Developer"
    },
    {
        "company": "InfraTech",
        "title": "Java Backend Engineer",
        "location": "Dallas, TX / Hybrid",
        "description": "Maintain enterprise Java backend services and REST APIs with MySQL database integration.",
        "required_skills": ["Java", "Spring Boot", "MySQL", "REST APIs", "Git"],
        "preferred_skills": ["Maven", "Docker", "PostgreSQL"],
        "experience": "Junior-Mid (1-3 yrs)",
        "category": "Java Developer"
    },

    # 19-21. Data Analyst
    {
        "company": "Insight Analytics",
        "title": "Data Analyst (SQL + Python)",
        "location": "Chicago, IL / Remote",
        "description": "Query large SQL databases, clean data with Pandas/NumPy, and build executive Tableau dashboards.",
        "required_skills": ["SQL", "Python", "PostgreSQL", "Pandas", "Excel"],
        "preferred_skills": ["Tableau", "Power BI", "ETL"],
        "experience": "Mid-Level (2-4 yrs)",
        "category": "Data Analyst"
    },
    {
        "company": "BizMetrics",
        "title": "Business Intelligence Data Analyst",
        "location": "Remote",
        "description": "Transform raw business data into actionable insights using SQL, PostgreSQL, Power BI, and Python.",
        "required_skills": ["SQL", "Power BI", "PostgreSQL", "Python", "Data Visualization"],
        "preferred_skills": ["Pandas", "ETL", "Statistics"],
        "experience": "Junior-Mid (1-3 yrs)",
        "category": "Data Analyst"
    },
    {
        "company": "MetricMind",
        "title": "Senior Data Operations Analyst",
        "location": "San Francisco, CA / Hybrid",
        "description": "Lead data warehouse modeling, ETL pipelines, and statistical analysis using SQL and Python.",
        "required_skills": ["SQL", "Python", "ETL", "Pandas", "Statistics"],
        "preferred_skills": ["Tableau", "PostgreSQL", "NumPy"],
        "experience": "Senior (4+ yrs)",
        "category": "Data Analyst"
    },

    # 22-24. Data Scientist
    {
        "company": "PredictiveAI",
        "title": "Data Scientist - Predictive Modeling",
        "location": "Seattle, WA / Remote",
        "description": "Develop supervised and unsupervised machine learning models using Python, scikit-learn, Pandas, and SQL.",
        "required_skills": ["Python", "SQL", "Machine Learning", "Pandas", "scikit-learn"],
        "preferred_skills": ["PyTorch", "TensorFlow", "Statistics"],
        "experience": "Mid-Level (3-5 yrs)",
        "category": "Data Scientist"
    },
    {
        "company": "BioScience AI",
        "title": "Senior Research Data Scientist",
        "location": "Boston, MA / Hybrid",
        "description": "Apply deep learning and statistical modeling to complex biological datasets using Python, PyTorch, and NumPy.",
        "required_skills": ["Python", "PyTorch", "Machine Learning", "Statistics", "NumPy"],
        "preferred_skills": ["TensorFlow", "scikit-learn", "Jupyter"],
        "experience": "Senior (5+ yrs)",
        "category": "Data Scientist"
    },
    {
        "company": "ConsumerInsights",
        "title": "Data Scientist - Customer Analytics",
        "location": "Remote",
        "description": "Analyze user behavior metrics, build classification models, and communicate insights using Python and SQL.",
        "required_skills": ["Python", "SQL", "Machine Learning", "Pandas", "NumPy"],
        "preferred_skills": ["scikit-learn", "Statistics", "Tableau"],
        "experience": "Junior-Mid (1-3 yrs)",
        "category": "Data Scientist"
    },

    # 25-27. Machine Learning Engineer
    {
        "company": "DeepVision Tech",
        "title": "Machine Learning Engineer",
        "location": "Austin, TX / Remote",
        "description": "Train and deploy deep learning models using PyTorch, TensorFlow, scikit-learn, and Docker microservices.",
        "required_skills": ["Python", "PyTorch", "TensorFlow", "scikit-learn", "Docker"],
        "preferred_skills": ["FastAPI", "MLOps", "CUDA"],
        "experience": "Mid-Level (2-4 yrs)",
        "category": "Machine Learning Engineer"
    },
    {
        "company": "VisionAI Labs",
        "title": "Computer Vision ML Engineer",
        "location": "San Francisco, CA / Hybrid",
        "description": "Build real-time object detection and image segmentation pipelines with PyTorch, CUDA, and OpenCV.",
        "required_skills": ["Python", "PyTorch", "Computer Vision", "Deep Learning", "Docker"],
        "preferred_skills": ["CUDA", "TensorFlow", "FastAPI"],
        "experience": "Senior (4+ yrs)",
        "category": "Machine Learning Engineer"
    },
    {
        "company": "NLPMinds",
        "title": "NLP Machine Learning Engineer",
        "location": "Remote",
        "description": "Train natural language processing models, sentiment classifiers, and text embeddings in Python.",
        "required_skills": ["Python", "PyTorch", "NLP", "scikit-learn", "FastAPI"],
        "preferred_skills": ["Transformers", "Docker", "SQL"],
        "experience": "Mid-Level (3-5 yrs)",
        "category": "Machine Learning Engineer"
    },

    # 28-30. AI Engineer
    {
        "company": "GenAI Innovations",
        "title": "Generative AI / LLM Engineer",
        "location": "San Francisco, CA / Remote",
        "description": "Build Retrieval-Augmented Generation (RAG) pipelines, LLM agents, and vector search engines using Python, LangChain, and FastAPI.",
        "required_skills": ["Python", "PyTorch", "LLMs", "LangChain", "FastAPI"],
        "preferred_skills": ["Transformers", "RAG", "Vector Databases", "Docker"],
        "experience": "Mid-Level (2-4 yrs)",
        "category": "AI Engineer"
    },
    {
        "company": "Cognitive Cloud",
        "title": "Senior AI Systems Architect",
        "location": "Remote",
        "description": "Architect enterprise AI platforms integrating OpenAI APIs, custom fine-tuned Transformers, and vector databases.",
        "required_skills": ["Python", "PyTorch", "Transformers", "RAG", "Vector Databases"],
        "preferred_skills": ["LangChain", "Docker", "FastAPI", "Prompt Engineering"],
        "experience": "Senior (5+ yrs)",
        "category": "AI Engineer"
    },

    # 31-32. DevOps Engineer
    {
        "company": "CloudOps Solutions",
        "title": "DevOps / Infrastructure Engineer",
        "location": "Seattle, WA / Remote",
        "description": "Automate cloud deployments using Linux, Docker, Kubernetes, Terraform, AWS, and CI/CD pipelines.",
        "required_skills": ["Linux", "Docker", "Kubernetes", "Terraform", "CI/CD", "AWS"],
        "preferred_skills": ["Ansible", "Python", "Bash"],
        "experience": "Mid-Level (3-5 yrs)",
        "category": "DevOps Engineer"
    },
    {
        "company": "Reliability Labs",
        "title": "Site Reliability Engineer (SRE)",
        "location": "New York, NY / Hybrid",
        "description": "Monitor system health, automate infrastructure with Bash/Python, and manage Kubernetes clusters.",
        "required_skills": ["Linux", "Docker", "Kubernetes", "Python", "Bash"],
        "preferred_skills": ["Terraform", "Jenkins", "AWS"],
        "experience": "Senior (4+ yrs)",
        "category": "DevOps Engineer"
    }
]

def seed_jobs_if_empty(db: Session):
    """
    Seeds initial dataset of 30+ realistic demo software jobs if the database table is empty.
    """
    try:
        existing_count = db.query(Job).count()
        if existing_count == 0:
            logger.info("Seeding 32 realistic demo software jobs into database...")
            for job_dict in SAMPLE_JOBS_SEED:
                db_job = Job(**job_dict)
                db.add(db_job)
            db.commit()
            logger.info("Demo job dataset seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding demo job dataset: {e}")
        db.rollback()

@router.post("/match", response_model=JobMatchResponse, status_code=status.HTTP_200_OK)
def match_jobs_for_resume(
    request: JobMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Match candidate resume against local job dataset using hybrid skill overlap + TF-IDF cosine similarity.
    - Requires JWT authentication
    - Enforces tenant isolation (user can only match using their own resume)
    - Returns top matched software jobs with match %, matched skills, and explanation
    """
    # 1. Ensure job dataset is seeded
    seed_jobs_if_empty(db)

    # 2. Fetch resume & verify tenant ownership
    resume = db.query(Resume).filter(
        Resume.id == request.resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access unauthorized."
        )

    if not resume.extracted_text or len(resume.extracted_text.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume extracted text is empty. Unable to perform job matching."
        )

    # 3. Query jobs from database with optional category filter
    query = db.query(Job)
    if request.category_filter:
        query = query.filter(Job.category == request.category_filter)

    jobs = query.all()
    if not jobs:
        return {
            "resume_id": resume.id,
            "total_jobs_evaluated": 0,
            "matches": []
        }

    # 4. Evaluate match score for each job
    evaluated_matches = []
    for job in jobs:
        job_data = {
            "id": job.id,
            "company": job.company,
            "title": job.title,
            "location": job.location,
            "description": job.description,
            "required_skills": job.required_skills,
            "preferred_skills": job.preferred_skills,
            "experience": job.experience,
            "category": job.category
        }
        match_result = calculate_job_match(resume.extracted_text, job_data)
        evaluated_matches.append(match_result)

    # 5. Sort matches by match_percentage descending
    evaluated_matches.sort(key=lambda x: x["match_percentage"], reverse=True)

    # Take top N
    top_matches = evaluated_matches[:request.top_n]

    return {
        "resume_id": resume.id,
        "total_jobs_evaluated": len(jobs),
        "matches": top_matches
    }

@router.get("", response_model=List[JobMatchResult])
def list_sample_jobs(
    category: Optional[str] = Query(None, description="Optional job category filter"),
    db: Session = Depends(get_db)
):
    """
    List available sample job postings.
    """
    seed_jobs_if_empty(db)
    query = db.query(Job)
    if category:
        query = query.filter(Job.category == category)
    jobs = query.limit(30).all()

    results = []
    for job in jobs:
        results.append({
            "id": job.id,
            "company": job.company,
            "title": job.title,
            "location": job.location,
            "description": job.description,
            "required_skills": job.required_skills,
            "preferred_skills": job.preferred_skills,
            "experience": job.experience,
            "category": job.category,
            "match_percentage": 0,
            "matched_skills": job.required_skills,
            "missing_skills": [],
            "explanation": "Sample demo job posting."
        })
    return results
