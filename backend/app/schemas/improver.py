from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ImprovementItem(BaseModel):
    id: str
    category: str  # Action Verbs, Measurable Impact, Weak Wording, Formatting, Keyword Density, Section Completeness
    impact_level: str  # High, Medium, Low
    original: str
    suggested: str
    reason: str

class SectionRecommendation(BaseModel):
    section: str  # Summary, Skills, Experience, Projects, Education
    status: str   # Good, Needs Improvement, Missing
    feedback: str
    recommendations: List[str]

class ResumeMetricsSummary(BaseModel):
    readability_score: int
    action_verb_count: int
    quantifiable_metrics_count: int
    total_suggestions: int

class ResumeImprovementResponse(BaseModel):
    id: int
    resume_id: int
    overall_health_score: int
    metrics_summary: ResumeMetricsSummary
    suggestions: List[ImprovementItem]
    section_recommendations: List[SectionRecommendation]
    created_at: datetime

    class Config:
        from_attributes = True
