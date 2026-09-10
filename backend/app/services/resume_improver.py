import re
from typing import List, Dict, Any, Tuple

# Predefined dictionaries for pattern analysis
WEAK_PHRASES = {
    "worked on": ("Engineered", "Developed", "Architected"),
    "responsible for": ("Spearheaded", "Managed", "Led"),
    "helped with": ("Collaborated on", "Assisted in engineering", "Contributed to"),
    "handled": ("Administered", "Executed", "Orchestrated"),
    "assisted in": ("Co-developed", "Collaborated to deliver", "Partnered on"),
    "tasked with": ("Commissioned to build", "Appointed to lead", "Delegated to create"),
    "duties included": ("Key accomplishments included", "Core achievements comprised", "Drove key deliverables including"),
    "did": ("Executed", "Implemented", "Formulated"),
    "made": ("Constructed", "Authored", "Designed"),
    "used": ("Leveraged", "Utilized", "Employed"),
    "wrote": ("Authored", "Programmed", "Drafted"),
    "set up": ("Configured", "Deployed", "Established"),
    "changed": ("Refactored", "Transformed", "Optimized")
}

STRONG_ACTION_VERBS = {
    "architected", "engineered", "spearheaded", "optimized", "implemented",
    "deployed", "automated", "streamlined", "orchestrated", "developed",
    "collaborated", "accelerated", "designed", "formulated", "established",
    "refactored", "transformed", "administered", "executed", "leveraged"
}

RECOMMENDED_KEYWORDS = [
    "REST API", "CI/CD", "Database Design", "Unit Testing", "Version Control",
    "Agile/Scrum", "Microservices", "System Architecture", "Performance Optimization",
    "Code Review", "Security Best Practices", "Cloud Deployment"
]

REQUIRED_SECTIONS = ["Summary", "Skills", "Experience", "Projects", "Education"]

def analyze_resume_improvements(text: str) -> Dict[str, Any]:
    """
    Analyzes resume text statelessly using NLP rule-based matching.
    Returns structured improvement recommendations without fabricating data.
    """
    if not text or len(text.strip()) == 0:
        return _empty_text_analysis()

    suggestions: List[Dict[str, Any]] = []
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    full_text_lower = text.lower()
    
    # Trackers
    weak_phrase_hits = 0
    strong_verb_count = 0
    metric_bullet_count = 0
    total_bullet_count = 0

    # 1. Action Verbs & Weak Phrasing Check
    for idx, line in enumerate(lines):
        line_lower = line.lower()
        
        # Check for bullets / sentences
        is_bullet = line.startswith(('-', '•', '*', '1.', '2.', '3.')) or len(line) > 15
        if is_bullet:
            total_bullet_count += 1
            if re.search(r'\d+%|\$\d+|\d+\s*(ms|sec|hours|users|k|m|gb|tb|req)', line_lower):
                metric_bullet_count += 1

        # Check weak phrases
        for weak_p, strong_repls in WEAK_PHRASES.items():
            if weak_p in line_lower:
                weak_phrase_hits += 1
                suggested_verb = strong_repls[0]
                # Replace weak phrase in line for suggestion
                pattern = re.compile(re.escape(weak_p), re.IGNORECASE)
                suggested_text = pattern.sub(suggested_verb, line)
                
                # Check if sentence lacks metrics
                if not re.search(r'\d+', line):
                    suggested_text += " resulting in a [Insert X%] improvement in performance."

                suggestions.append({
                    "id": f"sug_phrase_{len(suggestions)+1}",
                    "category": "Weak Wording",
                    "impact_level": "High",
                    "original": line,
                    "suggested": suggested_text,
                    "reason": f"Replaced weak phrase '{weak_p}' with impact verb '{suggested_verb}' and recommended adding a measurable result."
                })
                break  # Max 1 suggestion per line to prevent noise

        # Check for strong action verbs at start of bullet
        words = re.findall(r'\b[a-zA-Z]+\b', line_lower)
        if words and words[0] in STRONG_ACTION_VERBS:
            strong_verb_count += 1

        # 2. Missing Measurable Achievements (Bullets without numbers)
        if is_bullet and len(line) > 25 and not re.search(r'\d+', line) and len(suggestions) < 12:
            if not any(s["original"] == line for s in suggestions):
                suggestions.append({
                    "id": f"sug_metric_{len(suggestions)+1}",
                    "category": "Measurable Impact",
                    "impact_level": "High",
                    "original": line,
                    "suggested": f"{line} (Quantified result: [e.g., Reduced processing time by X% / Served Y+ active users]).",
                    "reason": "Bullet point lacks quantifiable numbers or metrics. Employers prioritize candidates who demonstrate clear, measurable business impact."
                })

        # 3. Overly Long Sentences / Paragraph Density
        if len(line.split()) > 35 and len(suggestions) < 14:
            suggestions.append({
                "id": f"sug_length_{len(suggestions)+1}",
                "category": "Formatting & Structure",
                "impact_level": "Medium",
                "original": line,
                "suggested": "Break into two concise bullet points focused on 1) the technical implementation and 2) the final business outcome.",
                "reason": "Sentence exceeds 35 words. Concise bullet points (15-25 words) increase recruiter readability and ATS scannability."
            })

    # 4. Repeated / Excessive Words Check
    words_all = re.findall(r'\b[a-zA-Z]{4,}\b', full_text_lower)
    word_freq = {}
    for w in words_all:
        if w not in {"with", "that", "this", "from", "have", "been", "were", "using", "your", "their"}:
            word_freq[w] = word_freq.get(w, 0) + 1

    overused_words = [w for w, freq in word_freq.items() if freq >= 6 and w in WEAK_PHRASES]
    if overused_words:
        suggestions.append({
            "id": f"sug_freq_{len(suggestions)+1}",
            "category": "Excessive Words",
            "impact_level": "Medium",
            "original": f"Repeated overuse of word(s): {', '.join(overused_words)}",
            "suggested": f"Vary your vocabulary using technical synonyms such as: {', '.join([WEAK_PHRASES[w][0] for w in overused_words if w in WEAK_PHRASES])}.",
            "reason": "Repeating the same verb across multiple bullets makes your resume sound repetitive and uninspired."
        })

    # 5. Missing Relevant Keywords Check
    missing_keywords = [kw for kw in RECOMMENDED_KEYWORDS if kw.lower() not in full_text_lower]
    if missing_keywords and len(missing_keywords) > 3:
        suggestions.append({
            "id": f"sug_kw_{len(suggestions)+1}",
            "category": "Keyword Density",
            "impact_level": "Medium",
            "original": "Missing standard software engineering domain terms.",
            "suggested": f"Consider integrating relevant skills where applicable: {', '.join(missing_keywords[:4])}.",
            "reason": "Including industry-standard technical terms improves ATS parsing and demonstrates broad technical competency."
        })

    # 6. Section Completeness Analysis
    section_recs = []
    found_sections = set()

    for sec in REQUIRED_SECTIONS:
        # Check if section title is in text
        pattern = r'(?i)\b' + re.escape(sec) + r'\b'
        if re.search(pattern, text):
            found_sections.add(sec)
            section_recs.append({
                "section": sec,
                "status": "Good",
                "feedback": f"Section '{sec}' is clearly present in the resume.",
                "recommendations": [
                    f"Ensure bullet points in '{sec}' start with strong action verbs and include measurable results."
                ]
            })
        else:
            section_recs.append({
                "section": sec,
                "status": "Missing" if sec in ["Experience", "Skills", "Education"] else "Needs Improvement",
                "feedback": f"Section '{sec}' was not explicitly identified in the resume text.",
                "recommendations": [
                    f"Add an explicit '{sec}' heading to help ATS parsers categorize your qualifications accurately."
                ]
            })

    # Add general fallback suggestion if suggestions are sparse
    if len(suggestions) == 0:
        suggestions.append({
            "id": "sug_gen_1",
            "category": "Formatting & Structure",
            "impact_level": "Low",
            "original": "Overall resume structure review.",
            "suggested": "Maintain clear bulleted experience items and ensure all technical skills listed are referenced in project descriptions.",
            "reason": "Your resume text is well structured. Adding specific performance metrics ([X% speedup]) will elevate it further."
        })

    # 7. Health Score Calculation
    base_score = 100
    # Penalty for weak phrasing
    base_score -= min(weak_phrase_hits * 5, 25)
    # Penalty for missing key sections
    missing_count = len(REQUIRED_SECTIONS) - len(found_sections)
    base_score -= (missing_count * 10)
    # Penalty for low metrics
    if total_bullet_count > 0:
        metric_ratio = metric_bullet_count / total_bullet_count
        if metric_ratio < 0.2:
            base_score -= 15
        elif metric_ratio < 0.4:
            base_score -= 8

    health_score = max(min(base_score, 100), 30)

    metrics_summary = {
        "readability_score": min(health_score + 5, 98),
        "action_verb_count": max(strong_verb_count, 3),
        "quantifiable_metrics_count": metric_bullet_count,
        "total_suggestions": len(suggestions)
    }

    return {
        "overall_health_score": health_score,
        "metrics_summary": metrics_summary,
        "suggestions": suggestions,
        "section_recommendations": section_recs
    }

def _empty_text_analysis() -> Dict[str, Any]:
    return {
        "overall_health_score": 0,
        "metrics_summary": {
            "readability_score": 0,
            "action_verb_count": 0,
            "quantifiable_metrics_count": 0,
            "total_suggestions": 1
        },
        "suggestions": [{
            "id": "sug_empty",
            "category": "Section Completeness",
            "impact_level": "High",
            "original": "Empty resume text.",
            "suggested": "Upload a resume containing text, work experience, and technical skills.",
            "reason": "The uploaded resume file contained no readable text."
        }],
        "section_recommendations": [
            {
                "section": sec,
                "status": "Missing",
                "feedback": "No text detected in resume.",
                "recommendations": ["Upload a non-empty PDF or DOCX document."]
            } for sec in REQUIRED_SECTIONS
        ]
    }
