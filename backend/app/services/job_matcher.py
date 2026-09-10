import re
import math
import logging
from collections import Counter
from typing import Dict, List, Any
from app.services.skill_analyzer import extract_skills_from_text

logger = logging.getLogger(__name__)

def tokenize(text: str) -> List[str]:
    """
    Tokenizes text into lowercase alphanumeric words.
    """
    return re.findall(r'\b[a-zA-Z0-9+#\.]+\b', text.lower())

def compute_pure_python_tfidf_cosine(text1: str, text2: str) -> float:
    """
    Calculates TF-IDF cosine similarity between two text documents using pure Python.
    Bypasses external C DLL imports for zero-dependency execution.
    """
    tokens1 = tokenize(text1)
    tokens2 = tokenize(text2)
    
    if not tokens1 or not tokens2:
        return 0.0

    tf1 = Counter(tokens1)
    tf2 = Counter(tokens2)

    vocab = set(tf1.keys()).union(set(tf2.keys()))
    doc_freq = {word: (1 if word in tf1 else 0) + (1 if word in tf2 else 0) for word in vocab}

    # Inverse document frequency with smoothing
    tfidf1 = {word: (tf1[word] / len(tokens1)) * (math.log(3 / (doc_freq[word] + 1)) + 1) for word in tf1}
    tfidf2 = {word: (tf2[word] / len(tokens2)) * (math.log(3 / (doc_freq[word] + 1)) + 1) for word in tf2}

    dot_product = sum(tfidf1.get(word, 0) * tfidf2.get(word, 0) for word in vocab)
    magnitude1 = math.sqrt(sum(val ** 2 for val in tfidf1.values()))
    magnitude2 = math.sqrt(sum(val ** 2 for val in tfidf2.values()))

    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0

    return dot_product / (magnitude1 * magnitude2)

def calculate_job_match(
    resume_text: str,
    job_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculates hybrid job match score combining skill overlap and TF-IDF text similarity.
    """
    candidate_skills = extract_skills_from_text(resume_text)
    candidate_skills_lower = set(s.lower() for s in candidate_skills)

    req_skills = job_data.get("required_skills", [])
    pref_skills = job_data.get("preferred_skills", [])
    all_job_skills = req_skills + pref_skills

    # 1. Skill Overlap Calculation (50% Weight)
    matched_skills = []
    missing_skills = []

    for skill in req_skills:
        if skill.lower() in candidate_skills_lower:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    # Check preferred skills matches
    for skill in pref_skills:
        if skill.lower() in candidate_skills_lower and skill not in matched_skills:
            matched_skills.append(skill)

    skill_overlap_ratio = len(matched_skills) / max(len(req_skills), 1)
    skill_score = min(skill_overlap_ratio * 100, 100)

    # 2. Text Cosine Similarity Calculation (50% Weight)
    job_full_text = f"{job_data.get('title', '')} {job_data.get('description', '')} {' '.join(all_job_skills)}"
    cosine_sim = compute_pure_python_tfidf_cosine(resume_text, job_full_text)
    # Scale cosine similarity (typically 0.15-0.65 into 0-100)
    text_score = min(max(cosine_sim * 220, 10), 100)

    # 3. Blended Overall Match Score
    overall_match = round((0.55 * skill_score) + (0.45 * text_score))
    overall_match = max(10, min(98, overall_match))

    # Generate Match Explanation
    if len(matched_skills) >= len(req_skills) * 0.7:
        explanation = f"Strong alignment! Matched {len(matched_skills)} key skills including {', '.join(matched_skills[:3])}."
    elif len(matched_skills) > 0:
        explanation = f"Moderate match. Found {', '.join(matched_skills[:2])}, but missing key role requirements: {', '.join(missing_skills[:2])}."
    else:
        explanation = f"Low skill overlap for this role. Missing core requirements: {', '.join(missing_skills[:3])}."

    return {
        "id": job_data.get("id"),
        "company": job_data.get("company"),
        "title": job_data.get("title"),
        "location": job_data.get("location"),
        "description": job_data.get("description"),
        "required_skills": req_skills,
        "preferred_skills": pref_skills,
        "experience": job_data.get("experience"),
        "category": job_data.get("category"),
        "match_percentage": overall_match,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "explanation": explanation
    }
