from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.improver import ResumeImprovement
from app.schemas.improver import ResumeImprovementResponse
from app.dependencies import get_current_user
from app.services.resume_improver import analyze_resume_improvements

router = APIRouter(prefix="/improver", tags=["Resume Improvement"])

@router.post("/suggest/{resume_id}", response_model=ResumeImprovementResponse, status_code=status.HTTP_200_OK)
def generate_resume_improvements(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate actionable resume improvement suggestions for a specific resume.
    - Enforces JWT authentication
    - Verifies resume ownership strictly (resume.user_id == current_user.id)
    - Uses stored extracted resume text
    - Persists/updates analysis in database
    """
    # 1. Fetch resume & verify tenant ownership
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access unauthorized."
        )

    # 2. Run analysis engine
    analysis_result = analyze_resume_improvements(resume.extracted_text or "")

    # 3. Check for existing saved improvement record or create new
    existing_improvement = db.query(ResumeImprovement).filter(
        ResumeImprovement.resume_id == resume_id,
        ResumeImprovement.user_id == current_user.id
    ).first()

    if existing_improvement:
        existing_improvement.overall_health_score = analysis_result["overall_health_score"]
        existing_improvement.suggestions = analysis_result["suggestions"]
        existing_improvement.section_recommendations = analysis_result["section_recommendations"]
        existing_improvement.metrics_summary = analysis_result["metrics_summary"]
        db.commit()
        db.refresh(existing_improvement)
        return existing_improvement
    else:
        new_improvement = ResumeImprovement(
            resume_id=resume.id,
            user_id=current_user.id,
            overall_health_score=analysis_result["overall_health_score"],
            suggestions=analysis_result["suggestions"],
            section_recommendations=analysis_result["section_recommendations"],
            metrics_summary=analysis_result["metrics_summary"]
        )
        db.add(new_improvement)
        db.commit()
        db.refresh(new_improvement)
        return new_improvement

@router.post("/improve/{resume_id}", response_model=ResumeImprovementResponse, status_code=status.HTTP_200_OK)
def generate_resume_improvements_alias(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return generate_resume_improvements(resume_id=resume_id, current_user=current_user, db=db)

@router.get("/{resume_id}", response_model=ResumeImprovementResponse)
def get_resume_improvements(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve existing stored resume improvement suggestions.
    Enforces JWT authentication & multi-tenant isolation.
    """
    # 1. Verify resume ownership
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access unauthorized."
        )

    # 2. Query stored record
    improvement = db.query(ResumeImprovement).filter(
        ResumeImprovement.resume_id == resume_id,
        ResumeImprovement.user_id == current_user.id
    ).first()

    if not improvement:
        # Auto-generate if not existing yet
        return generate_resume_improvements(resume_id=resume_id, current_user=current_user, db=db)

    return improvement
