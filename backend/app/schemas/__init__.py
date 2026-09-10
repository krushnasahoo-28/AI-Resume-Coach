from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token, TokenData
from app.schemas.resume import ResumeResponse, ResumeListItem
from app.schemas.analysis import AnalysisRequest, CategoryScores, AnalysisResponse
from app.schemas.skills import SkillGapRequest, SkillRecommendation, SkillGapResponse
from app.schemas.job import JobMatchRequest, JobMatchResult, JobMatchResponse

__all__ = [
    "UserRegister", "UserLogin", "UserResponse", "Token", "TokenData",
    "ResumeResponse", "ResumeListItem",
    "AnalysisRequest", "CategoryScores", "AnalysisResponse",
    "SkillGapRequest", "SkillRecommendation", "SkillGapResponse",
    "JobMatchRequest", "JobMatchResult", "JobMatchResponse"
]
