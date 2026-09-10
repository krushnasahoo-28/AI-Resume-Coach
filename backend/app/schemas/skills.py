from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class SkillGapRequest(BaseModel):
    target_role: Optional[str] = Field("Software Engineer", description="Target job role for skill gap comparison")

class SkillRecommendation(BaseModel):
    skill_name: str
    importance: str  # Critical, High, Medium
    why_it_matters: str
    learning_path: str

class SkillGapResponse(BaseModel):
    id: int
    resume_id: int
    user_id: int
    target_role: str
    skill_match_percentage: int
    matched_skills: List[str]
    missing_skills: List[str]
    all_extracted_skills: List[str]
    recommendations: List[SkillRecommendation]
    created_at: datetime

    class Config:
        from_attributes = True
