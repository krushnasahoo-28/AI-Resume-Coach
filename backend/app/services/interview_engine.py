import re
import random
from typing import List, Dict, Any

ROLE_QUESTIONS_POOL: Dict[str, List[Dict[str, Any]]] = {
    "Backend Developer": [
        {
            "category": "Technical",
            "question_text": "Explain the difference between SQL (relational) and NoSQL (non-relational) databases. When would you choose PostgreSQL over MongoDB?",
            "expected_keywords": ["schema", "acid", "relational", "transactions", "document", "scalability", "indexing"],
            "ideal_key_points": [
                "SQL databases provide ACID compliance and rigid schemas suitable for complex relational data.",
                "NoSQL databases provide schema flexibility and horizontal scaling for unstructured data.",
                "Choose PostgreSQL when complex queries, data integrity, and transactions are paramount."
            ]
        },
        {
            "category": "Technical",
            "question_text": "How do you handle database indexing to optimize query performance in a production REST API?",
            "expected_keywords": ["index", "b-tree", "query execution plan", "where clause", "primary key", "overhead", "latency"],
            "ideal_key_points": [
                "Index frequently queried columns (WHERE, JOIN, ORDER BY clauses).",
                "Analyze query execution plans (EXPLAIN ANALYZE) to identify bottlenecks.",
                "Avoid over-indexing as write operations (INSERT/UPDATE) incur performance overhead."
            ]
        },
        {
            "category": "Problem Solving",
            "question_text": "How would you design a rate-limiting middleware to protect a FastAPI backend against DDoS or API abuse?",
            "expected_keywords": ["redis", "token bucket", "sliding window", "ip address", "headers", "status 429", "middleware"],
            "ideal_key_points": [
                "Use a distributed cache like Redis to track request counts per IP or API key.",
                "Implement Token Bucket or Sliding Window log algorithms.",
                "Return HTTP 429 Too Many Requests header when limit is exceeded."
            ]
        }
    ],
    "Frontend Developer": [
        {
            "category": "Technical",
            "question_text": "Explain the React Virtual DOM and how the reconciliation process optimizes UI rendering.",
            "expected_keywords": ["virtual dom", "diffing", "reconciliation", "render", "state change", "performance", "props"],
            "ideal_key_points": [
                "Virtual DOM is a lightweight memory representation of the actual DOM.",
                "React uses a diffing algorithm during state changes to compute minimal required DOM updates.",
                "Minimizes expensive real DOM manipulations for fast 60fps UI updates."
            ]
        },
        {
            "category": "Technical",
            "question_text": "What is the difference between client-side rendering (CSR) and server-side rendering (SSR)?",
            "expected_keywords": ["csr", "ssr", "seo", "bundle", "initial load", "hydration", "next.js"],
            "ideal_key_points": [
                "CSR renders HTML in the browser via JavaScript; fast subsequent navigation but slower initial page load.",
                "SSR pre-renders HTML on the server for each request; superior SEO and fast initial paint.",
                "SSR requires server runtime infrastructure whereas CSR can be hosted on static CDNs."
            ]
        }
    ],
    "Full Stack Developer": [
        {
            "category": "Technical",
            "question_text": "Describe how JWT (JSON Web Tokens) work for stateless authentication between a React frontend and FastAPI backend.",
            "expected_keywords": ["jwt", "bearer token", "header", "payload", "signature", "secret key", "localstorage", "cookie"],
            "ideal_key_points": [
                "Client sends credentials to /login, backend verifies password and returns signed JWT.",
                "Client stores token (HttpOnly cookie or state) and passes it in Authorization: Bearer header.",
                "Backend verifies signature using secret key statelessly without DB lookup per request."
            ]
        },
        {
            "category": "Problem Solving",
            "question_text": "How do you handle state synchronization and global error handling across frontend components and backend APIs?",
            "expected_keywords": ["state management", "context api", "redux", "http status", "try catch", "toast", "interceptor"],
            "ideal_key_points": [
                "Centralize API calls using axios/fetch interceptors to catch HTTP 401/500 globally.",
                "Use React Context or Redux Toolkit for global user/session state.",
                "Display user-friendly toast/alert notifications without crashing UI components."
            ]
        }
    ],
    "Software Engineer": [
        {
            "category": "Technical",
            "question_text": "Explain Object-Oriented Programming (OOP) core pillars and how Dependency Injection improves software maintainability.",
            "expected_keywords": ["encapsulation", "inheritance", "polymorphism", "abstraction", "dependency injection", "decoupling", "unit testing"],
            "ideal_key_points": [
                "Four OOP pillars: Encapsulation, Abstraction, Inheritance, and Polymorphism.",
                "Dependency Injection decouples class implementation from dependent service instances.",
                "Makes unit testing significantly easier via mock object injection."
            ]
        },
        {
            "category": "Behavioral",
            "question_text": "Tell me about a time you encountered a severe production bug or technical deadlock. How did you diagnose and resolve it?",
            "expected_keywords": ["logs", "debugging", "root cause", "post-mortem", "collaboration", "fix", "prevention"],
            "ideal_key_points": [
                "Step 1: Inspect production logs/stack traces to isolate error root cause.",
                "Step 2: Apply hotfix or roll back deployment to restore service availability.",
                "Step 3: Conduct post-mortem review and add regression test coverage."
            ]
        }
    ]
}

GENERIC_BEHAVIORAL_QUESTIONS = [
    {
        "category": "Behavioral",
        "question_text": "Describe a challenging project you worked on. What was your specific role and how did you overcome technical roadblocks?",
        "expected_keywords": ["role", "challenge", "solution", "outcome", "team", "collaboration", "learned"],
        "ideal_key_points": [
            "Use STAR method (Situation, Task, Action, Result).",
            "Emphasize personal contributions and technical ownership.",
            "Highlight measurable results and lessons learned."
        ]
    },
    {
        "category": "Behavioral",
        "question_text": "How do you prioritize competing technical tasks when deadlines are tight and scope changes unexpectedly?",
        "expected_keywords": ["prioritization", "trade-offs", "communication", "agile", "stakeholders", "mvp"],
        "ideal_key_points": [
            "Assess impact vs effort to focus on core MVP functionality.",
            "Communicate trade-offs clearly to project managers and stakeholders.",
            "Break down tasks into smaller sprint backlog items."
        ]
    }
]

def generate_interview_questions(
    resume_text: str,
    target_role: str,
    difficulty: str = "Medium",
    count: int = 5
) -> List[Dict[str, Any]]:
    """
    Generates a list of interview questions tailored to the candidate's target role,
    resume text, and chosen difficulty setting.
    """
    questions: List[Dict[str, Any]] = []
    
    # 1. Fetch role pool or default to Software Engineer pool
    role_pool = ROLE_QUESTIONS_POOL.get(target_role, ROLE_QUESTIONS_POOL["Software Engineer"])
    
    # 2. Extract resume skills/keywords to construct resume-specific question
    detected_skills = []
    for sk in ["Python", "Java", "React", "FastAPI", "Docker", "PostgreSQL", "JavaScript", "AWS", "Git", "MongoDB"]:
        if re.search(r'\b' + re.escape(sk) + r'\b', resume_text, re.IGNORECASE):
            detected_skills.append(sk)

    # 3. Create Resume/Project-specific question if skills detected
    if detected_skills:
        primary_skill = detected_skills[0]
        secondary_skill = detected_skills[1] if len(detected_skills) > 1 else "REST APIs"
        questions.append({
            "question_index": 1,
            "question_text": f"Your resume highlights proficiency with {primary_skill} and {secondary_skill}. Can you walk me through how you applied {primary_skill} in your most recent project architecture?",
            "category": "Resume/Project",
            "difficulty": difficulty,
            "expected_keywords": [primary_skill.lower(), secondary_skill.lower(), "architecture", "design", "implementation", "database"],
            "ideal_key_points": [
                f"Explain specific project context where {primary_skill} was used.",
                "Describe architectural choices, API endpoints, or data flow.",
                "Highlight key results or efficiency improvements."
            ]
        })

    # 4. Fill remaining question count from role pool & behavioral pool
    pool_index = 0
    while len(questions) < count:
        if pool_index < len(role_pool):
            q_template = role_pool[pool_index]
            pool_index += 1
        else:
            q_template = GENERIC_BEHAVIORAL_QUESTIONS[len(questions) % len(GENERIC_BEHAVIORAL_QUESTIONS)]

        q_item = {
            "question_index": len(questions) + 1,
            "question_text": q_template["question_text"],
            "category": q_template["category"],
            "difficulty": difficulty,
            "expected_keywords": q_template["expected_keywords"],
            "ideal_key_points": q_template["ideal_key_points"]
        }
        questions.append(q_item)

    return questions[:count]

def evaluate_user_answer(
    question: Dict[str, Any],
    answer_text: str
) -> Dict[str, Any]:
    """
    Evaluates candidate's written interview answer against question criteria.
    Returns detailed scoring out of 100, strengths, weaknesses, and improvement advice.
    """
    if not answer_text or len(answer_text.strip()) == 0:
        return {
            "question_index": question.get("question_index", 1),
            "question_text": question.get("question_text", ""),
            "user_answer": "[No answer provided]",
            "score": 0,
            "correctness": "Needs Improvement",
            "relevance": "Unrelated",
            "completeness": "Incomplete",
            "technical_understanding": "Low",
            "clarity": "Unclear",
            "strengths": ["None identified."],
            "weaknesses": ["No answer submitted for evaluation."],
            "improvement_suggestion": "Be sure to attempt every interview question, even if providing a partial conceptual overview.",
            "ideal_key_points": question.get("ideal_key_points", [])
        }

    words = re.findall(r'\b\w+\b', answer_text.lower())
    word_count = len(words)
    expected_keywords = question.get("expected_keywords", [])
    
    # 1. Keyword & Technical Matching
    matched_kw = [kw for kw in expected_keywords if kw.lower() in answer_text.lower()]
    kw_ratio = len(matched_kw) / max(len(expected_keywords), 1)

    # 2. Length & Depth Scoring
    if word_count < 15:
        depth_score = 40
        completeness = "Incomplete"
    elif word_count < 35:
        depth_score = 70
        completeness = "Moderate"
    else:
        depth_score = 95
        completeness = "Comprehensive"

    # 3. Structure & Clarity Matching
    clarity_indicators = ["because", "for example", "specifically", "resulted in", "firstly", "in addition", "such as", "to optimize"]
    has_clarity = any(ci in answer_text.lower() for ci in clarity_indicators)
    clarity_label = "High" if has_clarity else "Moderate"

    # 4. Overall Score Calculation
    raw_score = (kw_ratio * 45) + (depth_score * 0.40) + (15 if has_clarity else 5)
    score = max(min(int(raw_score), 98), 25)

    # 5. Feedback Arrays
    strengths = []
    weaknesses = []

    if matched_kw:
        strengths.append(f"Used technical terminology correctly: {', '.join(matched_kw[:3])}.")
    if word_count >= 30:
        strengths.append("Provided a detailed explanation with adequate context.")
    if has_clarity:
        strengths.append("Structured the answer logically with cause-and-effect explanations.")

    if not strengths:
        strengths.append("Demonstrated willingness to tackle technical topics.")

    if len(matched_kw) < len(expected_keywords) // 2:
        missing = [kw for kw in expected_keywords if kw not in matched_kw]
        if missing:
            weaknesses.append(f"Omitted key technical concepts: {', '.join(missing[:3])}.")

    if word_count < 25:
        weaknesses.append("Answer was somewhat concise; expanding on implementation details will improve score.")

    improvement_suggestion = (
        "Focus on structuring your response using real-world architectural examples and explicitly mentioning key technical terms."
        if score < 75 else "Great response! To elevate it further, mention quantifiable metrics or performance outcomes."
    )

    return {
        "question_index": question.get("question_index", 1),
        "question_text": question.get("question_text", ""),
        "user_answer": answer_text,
        "score": score,
        "correctness": "Strong" if score >= 80 else "Satisfactory" if score >= 60 else "Needs Improvement",
        "relevance": "High" if kw_ratio >= 0.3 else "Moderate",
        "completeness": completeness,
        "technical_understanding": "Advanced" if score >= 85 else "Proficient" if score >= 65 else "Developing",
        "clarity": clarity_label,
        "strengths": strengths,
        "weaknesses": weaknesses if weaknesses else ["Minor depth additions could refine answer further."],
        "improvement_suggestion": improvement_suggestion,
        "ideal_key_points": question.get("ideal_key_points", [])
    }

def calculate_interview_final_results(
    answers: List[Dict[str, Any]],
    target_role: str
) -> Dict[str, Any]:
    """
    Computes overall interview score, technical vs communication breakdown,
    and study recommendations after all questions are answered.
    """
    if not answers:
        return {
            "overall_score": 0,
            "technical_score": 0,
            "communication_score": 0,
            "strong_areas": [],
            "weak_areas": [],
            "study_recommendations": []
        }

    total_score = sum(a.get("score", 0) for a in answers)
    overall_score = int(total_score / len(answers))
    
    technical_scores = [a.get("score", 0) for a in answers if a.get("question_text")]
    technical_score = int(sum(technical_scores) / len(technical_scores)) if technical_scores else overall_score
    
    comm_scores = [85 if a.get("clarity") == "High" else 65 for a in answers]
    communication_score = int(sum(comm_scores) / len(comm_scores))

    strong_areas = []
    weak_areas = []

    if overall_score >= 80:
        strong_areas.append(f"Solid technical knowledge in {target_role} core concepts.")
    if communication_score >= 75:
        strong_areas.append("Clear and structured explanation style.")

    if not strong_areas:
        strong_areas.append("Good foundational understanding of software development principles.")

    if overall_score < 75:
        weak_areas.append("Technical depth in complex architectural questions.")
    if communication_score < 75:
        weak_areas.append("Elaborating on implementation steps and concrete examples.")

    study_recommendations = [
        f"Review core system design principles and database indexing strategies for {target_role}.",
        "Practice using the STAR method (Situation, Task, Action, Result) for behavioral questions.",
        "Include concrete performance metrics (e.g. latency, throughput) when explaining past achievements."
    ]

    return {
        "overall_score": overall_score,
        "technical_score": technical_score,
        "communication_score": communication_score,
        "strong_areas": strong_areas,
        "weak_areas": weak_areas if weak_areas else ["Keep practicing mock interviews to maintain peak performance."],
        "study_recommendations": study_recommendations
    }
