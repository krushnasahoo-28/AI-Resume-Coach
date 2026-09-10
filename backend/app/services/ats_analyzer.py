import re
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

# Master Skill Dictionary mapped by target role
ROLE_SKILLS_MAP: Dict[str, List[str]] = {
    "Software Engineer": [
        "python", "java", "c++", "javascript", "typescript", "react", "fastapi", "sql", "postgresql",
        "git", "data structures", "algorithms", "rest apis", "docker", "system design", "linux"
    ],
    "Backend Developer": [
        "python", "java", "go", "fastapi", "django", "spring boot", "postgresql", "mongodb", "redis",
        "rest apis", "microservices", "docker", "kubernetes", "sql", "git"
    ],
    "Frontend Developer": [
        "react", "typescript", "javascript", "html5", "css3", "tailwind css", "redux", "next.js",
        "webpack", "vite", "rest apis", "responsive design", "git"
    ],
    "Full Stack Developer": [
        "react", "typescript", "node.js", "python", "fastapi", "postgresql", "mongodb", "html", "css",
        "git", "docker", "rest apis", "graphql", "sql"
    ],
    "Python Developer": [
        "python", "django", "fastapi", "flask", "asyncio", "pytest", "sql", "postgresql", "pandas",
        "numpy", "rest apis", "docker", "git"
    ],
    "Java Developer": [
        "java", "spring boot", "hibernate", "maven", "gradle", "microservices", "rest apis", "postgresql",
        "mysql", "junit", "docker", "kafka", "git"
    ],
    "Data Analyst": [
        "python", "sql", "postgresql", "excel", "tableau", "power bi", "pandas", "numpy",
        "data visualization", "etl", "statistics", "business intelligence"
    ],
    "Data Scientist": [
        "python", "r", "sql", "machine learning", "pandas", "numpy", "scikit-learn", "pytorch",
        "tensorflow", "statistics", "data mining", "jupyter"
    ],
    "Machine Learning Engineer": [
        "python", "pytorch", "tensorflow", "scikit-learn", "mlops", "docker", "cuda",
        "deep learning", "nlp", "computer vision", "fastapi", "sql"
    ],
    "AI Engineer": [
        "python", "pytorch", "llms", "langchain", "transformers", "openai", "rag",
        "vector databases", "fastapi", "docker", "prompt engineering", "nlp"
    ],
    "DevOps Engineer": [
        "linux", "docker", "kubernetes", "terraform", "ansible", "jenkins", "ci/cd", "aws",
        "cloud", "bash", "python", "prometheus", "grafana", "git"
    ]
}

# Generic technical skills repository
GENERIC_TECH_SKILLS = [
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "ruby", "php", "rust",
    "react", "angular", "vue", "node.js", "express", "fastapi", "django", "flask", "spring boot",
    "sql", "postgresql", "mysql", "sqlite", "mongodb", "redis", "elasticsearch", "aws", "azure", "gcp",
    "docker", "kubernetes", "git", "ci/cd", "rest api", "graphql", "html", "css", "tailwind",
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "linux", "bash"
]

ACTION_VERBS = [
    "developed", "designed", "engineered", "implemented", "built", "optimized", "managed",
    "led", "deployed", "integrated", "scaled", "reduced", "increased", "automated", "created",
    "architected", "refactored", "improved", "launched", "spearheaded"
]

STANDARD_SECTIONS = {
    "experience": ["experience", "employment", "work history", "professional experience"],
    "education": ["education", "academic", "degree", "university", "qualification"],
    "skills": ["skills", "technical skills", "technologies", "expertise", "core competencies"],
    "projects": ["projects", "personal projects", "key projects"],
    "summary": ["summary", "objective", "profile", "about me"],
    "certifications": ["certifications", "licenses", "certificates"]
}

def analyze_resume_ats(extracted_text: str, target_role: str = "Software Engineer") -> Dict[str, Any]:
    """
    Deterministically evaluates resume text against ATS criteria and target role.
    """
    clean_text = extracted_text.lower()
    words = re.findall(r'\b\w+\b', clean_text)
    word_count = len(words)

    # 1. Technical Skills Score (Max 30 pts)
    role_skills = ROLE_SKILLS_MAP.get(target_role, ROLE_SKILLS_MAP["Software Engineer"])
    detected_skills_set = set()

    for skill in role_skills + GENERIC_TECH_SKILLS:
        # Match skill phrase in text
        if re.search(r'\b' + re.escape(skill) + r'\b', clean_text):
            # Format nicely
            detected_skills_set.add(skill.title())

    detected_skills = sorted(list(detected_skills_set))
    role_matches = [s for s in role_skills if re.search(r'\b' + re.escape(s) + r'\b', clean_text)]
    
    skill_match_ratio = len(role_matches) / max(len(role_skills), 1)
    tech_score = round(min(skill_match_ratio * 30, 30))

    # 2. Structure & Section Headers (Max 20 pts)
    detected_sections = []
    for section_name, keywords in STANDARD_SECTIONS.items():
        if any(re.search(r'\b' + re.escape(kw) + r'\b', clean_text) for kw in keywords):
            detected_sections.append(section_name)

    structure_ratio = len(detected_sections) / len(STANDARD_SECTIONS)
    structure_score = round(structure_ratio * 20)

    # 3. Work Experience & Impact (Max 20 pts)
    # Action verbs match (max 10 pts)
    action_verb_matches = [verb for verb in ACTION_VERBS if re.search(r'\b' + re.escape(verb) + r'\b', clean_text)]
    verb_score = min(len(action_verb_matches) * 2, 10)

    # Quantifiable metrics match (max 10 pts)
    metric_matches = re.findall(r'\b\d+%\b|\$\d+|\b\d+\s*(?:users|clients|percent|ms|seconds|x|x\b)\b', clean_text)
    metric_score = min(len(metric_matches) * 2.5, 10)

    experience_score = round(verb_score + metric_score)

    # 4. Education & Credentials (Max 15 pts)
    edu_keywords = ["bachelor", "master", "phd", "b.s", "m.s", "computer science", "engineering", "degree", "university", "college"]
    found_edu = any(re.search(r'\b' + re.escape(kw) + r'\b', clean_text) for kw in edu_keywords)
    education_score = 15 if found_edu else 5

    # 5. Readability & Length (Max 15 pts)
    # Word count score (max 10 pts)
    if 250 <= word_count <= 1200:
        length_score = 10
    elif 150 <= word_count < 250 or 1200 < word_count <= 1800:
        length_score = 7
    else:
        length_score = 4

    # Contact info check (max 5 pts)
    has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+', clean_text))
    has_phone = bool(re.search(r'\+?\d[\d\s\-\(\)]{8,}\d', clean_text))
    contact_score = 5 if (has_email or has_phone) else 0

    readability_score = round(length_score + contact_score)

    # Overall Score Calculation
    overall_score = tech_score + structure_score + experience_score + education_score + readability_score
    overall_score = max(5, min(100, overall_score))

    # Generate Strengths, Weaknesses, and Suggestions
    strengths = []
    weaknesses = []
    suggestions = []

    if tech_score >= 20:
        strengths.append(f"Strong alignment of technical skills for the {target_role} position.")
    else:
        weaknesses.append(f"Missing core technical keywords typically expected for a {target_role}.")
        missing = [s.title() for s in role_skills if s.title() not in detected_skills][:4]
        if missing:
            suggestions.append(f"Consider adding key target skills: {', '.join(missing)}.")

    if len(detected_sections) >= 4:
        strengths.append("Clear structural organization with standard resume sections.")
    else:
        weaknesses.append("Missing essential section headings (such as Projects or Certifications).")
        suggestions.append("Use standard section headings like 'Work Experience', 'Education', 'Technical Skills', and 'Projects'.")

    if metric_score >= 5:
        strengths.append("Includes quantifiable impact metrics (e.g. percentages, numbers, or performance metrics).")
    else:
        weaknesses.append("Lacks quantifiable metrics demonstrating project impact.")
        suggestions.append("Add measurable outcomes to your bullet points (e.g., 'Improved API response time by 35%').")

    if action_verb_matches:
        strengths.append(f"Effective use of strong action verbs ({', '.join(action_verb_matches[:3])}).")
    else:
        suggestions.append("Begin bullet points with strong action verbs like 'Engineered', 'Implemented', or 'Architected'.")

    if word_count < 250:
        weaknesses.append("Resume content appears brief (under 250 words).")
        suggestions.append("Elaborate on technical project implementations and key responsibilities.")

    return {
        "overall_score": overall_score,
        "category_scores": {
            "technical_skills": tech_score,
            "structure": structure_score,
            "experience": experience_score,
            "education": education_score,
            "readability": readability_score
        },
        "detected_skills": detected_skills,
        "strengths": strengths if strengths else ["Basic contact and text formatting detected."],
        "weaknesses": weaknesses if weaknesses else ["Minor formatting adjustments could further optimize score."],
        "suggestions": suggestions if suggestions else ["Ensure your resume is updated with recent projects."]
    }
