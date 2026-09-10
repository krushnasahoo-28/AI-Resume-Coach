from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class InterviewStartRequest(BaseModel):
    resume_id: int
    target_role: str = Field(default="Software Engineer")
    difficulty: str = Field(default="Medium")
    total_questions: int = Field(default=5)

class InterviewQuestionItem(BaseModel):
    question_index: int
    question_text: str
    category: str  # Technical, Resume/Project, Problem Solving, Behavioral
    difficulty: str

class InterviewStartResponse(BaseModel):
    interview_id: int
    resume_id: int
    target_role: str
    difficulty: str
    total_questions: int
    current_question_index: int
    first_question: InterviewQuestionItem

class AnswerSubmitRequest(BaseModel):
    question_index: int
    answer_text: str

class QuestionEvaluationFeedback(BaseModel):
    question_index: int
    question_text: str
    user_answer: str
    score: int
    correctness: str
    relevance: str
    completeness: str
    technical_understanding: str
    clarity: str
    strengths: List[str]
    weaknesses: List[str]
    improvement_suggestion: str
    ideal_key_points: List[str]

class AnswerSubmitResponse(BaseModel):
    interview_id: int
    question_index: int
    feedback: QuestionEvaluationFeedback
    is_completed: bool
    next_question: Optional[InterviewQuestionItem] = None

class InterviewSummaryResponse(BaseModel):
    id: int
    resume_id: int
    target_role: str
    difficulty: str
    total_questions: int
    status: str
    overall_score: Optional[int] = None
    technical_score: Optional[int] = None
    communication_score: Optional[int] = None
    questions: List[Dict[str, Any]]
    answers: List[Dict[str, Any]]
    summary_feedback: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
