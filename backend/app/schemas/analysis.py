from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class AnalysisRequest(BaseModel):
    target_role: Optional[str] = Field("Software Engineer", description="Target job role for ATS skill matching")

class CategoryScores(BaseModel):
    technical_skills: int = Field(..., ge=0, le=30, description="Max 30 pts")
    structure: int = Field(..., ge=0, le=20, description="Max 20 pts")
    experience: int = Field(..., ge=0, le=20, description="Max 20 pts")
    education: int = Field(..., ge=0, le=15, description="Max 15 pts")
    readability: int = Field(..., ge=0, le=15, description="Max 15 pts")

class AnalysisResponse(BaseModel):
    id: int
    resume_id: int
    user_id: int
    target_role: str
    overall_score: int
    category_scores: CategoryScores
    detected_skills: List[str]
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    created_at: datetime

    class Config:
        from_attributes = True
