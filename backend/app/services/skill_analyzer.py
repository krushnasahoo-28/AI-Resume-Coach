import re
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

# Complete master skills taxonomy
SKILLS_TAXONOMY: Dict[str, str] = {
    "python": "Python",
    "java": "Java",
    "c++": "C++",
    "c#": "C#",
    "c": "C",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "react": "React",
    "node.js": "Node.js",
    "node": "Node.js",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "spring boot": "Spring Boot",
    "html": "HTML",
    "html5": "HTML5",
    "css": "CSS",
    "css3": "CSS3",
    "tailwind css": "Tailwind CSS",
    "tailwind": "Tailwind CSS",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "sql": "SQL",
    "git": "Git",
    "github": "GitHub",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "GCP",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "nlp": "NLP",
    "computer vision": "Computer Vision",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch",
    "scikit-learn": "scikit-learn",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "rest apis": "REST APIs",
    "rest api": "REST APIs",
    "microservices": "Microservices",
    "system design": "System Design",
    "ci/cd": "CI/CD",
    "linux": "Linux",
    "bash": "Bash",
    "redux": "Redux",
    "next.js": "Next.js",
    "graphql": "GraphQL",
    "kafka": "Kafka",
    "terraform": "Terraform",
    "ansible": "Ansible",
    "jenkins": "Jenkins",
    "llms": "LLMs",
    "langchain": "LangChain",
    "transformers": "Transformers",
    "rag": "RAG",
    "vector databases": "Vector Databases"
}

# Role Requirements
ROLE_REQUIREMENTS: Dict[str, List[str]] = {
    "Software Engineer": [
        "Python", "Java", "C++", "JavaScript", "SQL", "Git", "Docker", "System Design", "REST APIs", "Data Structures"
    ],
    "Backend Developer": [
        "Python", "Java", "FastAPI", "Django", "PostgreSQL", "MongoDB", "Redis", "REST APIs", "Microservices", "Docker", "Kubernetes"
    ],
    "Frontend Developer": [
        "React", "TypeScript", "JavaScript", "HTML5", "CSS3", "Tailwind CSS", "Redux", "Next.js", "REST APIs", "Git"
    ],
    "Full Stack Developer": [
        "React", "TypeScript", "Node.js", "Python", "FastAPI", "PostgreSQL", "MongoDB", "HTML5", "CSS3", "Git", "Docker", "REST APIs"
    ],
    "Python Developer": [
        "Python", "Django", "FastAPI", "Flask", "SQL", "PostgreSQL", "Pandas", "NumPy", "Docker", "Git", "REST APIs"
    ],
    "Java Developer": [
        "Java", "Spring Boot", "Microservices", "REST APIs", "PostgreSQL", "MySQL", "Docker", "Kafka", "Git"
    ],
    "Data Analyst": [
        "Python", "SQL", "PostgreSQL", "Pandas", "NumPy", "Statistics", "ETL", "Data Visualization"
    ],
    "Data Scientist": [
        "Python", "SQL", "Machine Learning", "Pandas", "NumPy", "scikit-learn", "PyTorch", "TensorFlow", "Statistics"
    ],
    "Machine Learning Engineer": [
        "Python", "PyTorch", "TensorFlow", "scikit-learn", "Docker", "Deep Learning", "NLP", "Computer Vision", "FastAPI", "SQL"
    ],
    "AI Engineer": [
        "Python", "PyTorch", "LLMs", "LangChain", "Transformers", "RAG", "Vector Databases", "FastAPI", "Docker", "NLP"
    ],
    "DevOps Engineer": [
        "Linux", "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins", "CI/CD", "AWS", "Bash", "Python", "Git"
    ]
}

# Importance & Explanation Database for Missing Skills
SKILL_INSIGHTS: Dict[str, Dict[str, str]] = {
    "Docker": {
        "importance": "Critical",
        "why_it_matters": "Essential for containerizing applications and ensuring reproducible production environments.",
        "learning_path": "Build multi-container apps using Dockerfiles and docker-compose orchestration."
    },
    "Kubernetes": {
        "importance": "High",
        "why_it_matters": "Industry standard for automated scaling, deployment, and management of cloud microservices.",
        "learning_path": "Deploy local Kubernetes clusters with Minikube/k3s and configure deployment manifests."
    },
    "FastAPI": {
        "importance": "High",
        "why_it_matters": "High-performance Python web framework widely adopted for modern asynchronous REST APIs.",
        "learning_path": "Develop asynchronous Python APIs with Pydantic validation and OpenAPI documentation."
    },
    "React": {
        "importance": "Critical",
        "why_it_matters": "Dominant frontend UI framework expected for client-side modern web application engineering.",
        "learning_path": "Master functional components, custom hooks, context state management, and Vite tooling."
    },
    "TypeScript": {
        "importance": "High",
        "why_it_matters": "Provides compile-time type safety, reducing bugs and improving developer velocity in large codebases.",
        "learning_path": "Convert JavaScript projects to TypeScript using strict interfaces and generic types."
    },
    "PostgreSQL": {
        "importance": "Critical",
        "why_it_matters": "Most robust open-source relational database required for backend data modeling and indexing.",
        "learning_path": "Practice complex SQL queries, JOINs, indexing strategies, and database migrations with SQLAlchemy."
    },
    "AWS": {
        "importance": "High",
        "why_it_matters": "Leading cloud provider for hosting serverless APIs, storage, databases, and microservices.",
        "learning_path": "Deploy applications to AWS EC2/S3/Lambda and configure IAM security policies."
    },
    "Machine Learning": {
        "importance": "Critical",
        "why_it_matters": "Fundamental paradigm for predictive modeling, statistical learning, and data intelligence.",
        "learning_path": "Build regression/classification models with scikit-learn and evaluate precision/recall metrics."
    },
    "PyTorch": {
        "importance": "Critical",
        "why_it_matters": "Standard deep learning framework for training neural networks, LLMs, and AI models.",
        "learning_path": "Implement neural network architectures, custom datasets, loss functions, and CUDA acceleration."
    },
    "REST APIs": {
        "importance": "Critical",
        "why_it_matters": "Standard communication protocol between frontend UI, mobile apps, and microservice backends.",
        "learning_path": "Design RESTful endpoints following HTTP verb conventions, status codes, and JSON schemas."
    },
    "System Design": {
        "importance": "High",
        "why_it_matters": "Crucial for mid-to-senior software engineering interviews evaluating scalability, caching, and database design.",
        "learning_path": "Study load balancing, caching (Redis), database sharding, and message queues (Kafka/RabbitMQ)."
    }
}

def extract_skills_from_text(text: str) -> List[str]:
    """
    Parses resume text and extracts matching technical skills from taxonomy.
    """
    clean = text.lower()
    extracted_set = set()

    for key, display_name in SKILLS_TAXONOMY.items():
        pattern = r'\b' + re.escape(key) + r'\b'
        if re.search(pattern, clean):
            extracted_set.add(display_name)

    return sorted(list(extracted_set))

def perform_skill_gap_analysis(extracted_text: str, target_role: str = "Software Engineer") -> Dict[str, Any]:
    """
    Compares candidate resume skills against target role requirements and generates recommendations.
    """
    extracted_skills = extract_skills_from_text(extracted_text)
    required_skills = ROLE_REQUIREMENTS.get(target_role, ROLE_REQUIREMENTS["Software Engineer"])

    # Normalization helper for matching
    extracted_lower = set(s.lower() for s in extracted_skills)

    matched_skills = []
    missing_skills = []

    for req in required_skills:
        req_lower = req.lower()
        if req_lower in extracted_lower:
            matched_skills.append(req)
        else:
            missing_skills.append(req)

    # Calculate Skill Match Percentage
    match_percentage = round((len(matched_skills) / max(len(required_skills), 1)) * 100)

    # Generate Learning Recommendations for missing skills
    recommendations = []
    for skill in missing_skills:
        insight = SKILL_INSIGHTS.get(skill, {
            "importance": "High",
            "why_it_matters": f"Highly valued core technical skill for {target_role} positions.",
            "learning_path": f"Build hands-on projects incorporating {skill} into your software portfolio."
        })

        recommendations.append({
            "skill_name": skill,
            "importance": insight["importance"],
            "why_it_matters": insight["why_it_matters"],
            "learning_path": insight["learning_path"]
        })

    return {
        "target_role": target_role,
        "skill_match_percentage": match_percentage,
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(missing_skills),
        "all_extracted_skills": extracted_skills,
        "recommendations": recommendations
    }
