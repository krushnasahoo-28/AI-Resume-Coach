from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class JobMatchRequest(BaseModel):
    resume_id: int = Field(..., description="ID of candidate resume to match")
    category_filter: Optional[str] = Field(None, description="Optional target category filter (e.g. Backend Developer)")
    top_n: Optional[int] = Field(10, ge=1, le=50, description="Number of top job matches to return")

class JobMatchResult(BaseModel):
    id: int
    company: str
    title: str
    location: str
    description: str
    required_skills: List[str]
    preferred_skills: List[str]
    experience: str
    category: str
    match_percentage: int
    matched_skills: List[str]
    missing_skills: List[str]
    explanation: str

    class Config:
        from_attributes = True

class JobMatchResponse(BaseModel):
    resume_id: int
    total_jobs_evaluated: int
    matches: List[JobMatchResult]
