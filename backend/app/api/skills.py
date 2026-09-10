from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.skill_gap import SkillGap
from app.schemas.skills import SkillGapRequest, SkillGapResponse
from app.dependencies import get_current_user
from app.services.skill_analyzer import perform_skill_gap_analysis

router = APIRouter(prefix="/skills", tags=["Skill Gap Analysis"])

@router.post("/gap-analysis/{resume_id}", response_model=SkillGapResponse, status_code=status.HTTP_200_OK)
def analyze_skill_gap(
    resume_id: int,
    request: Optional[SkillGapRequest] = None,
    target_role: Optional[str] = Query("Software Engineer", description="Target job role for skill gap comparison"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Perform technical skill extraction and role skill gap analysis.
    - Requires JWT authentication
    - Enforces tenant isolation (user can only analyze their own resume)
    - Compares resume skills against target role requirements
    - Generates match %, missing skills, and learning path recommendations
    - Persists results in PostgreSQL
    """
    selected_role = "Software Engineer"
    if request and request.target_role:
        selected_role = request.target_role
    elif target_role:
        selected_role = target_role

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

    # 2. Check extracted text presence
    if not resume.extracted_text or len(resume.extracted_text.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume extracted text is empty. Unable to perform skill gap analysis."
        )

    # 3. Execute Skill Gap Analysis engine
    analysis_data = perform_skill_gap_analysis(resume.extracted_text, selected_role)

    # 4. Check existing SkillGap record in DB
    existing_gap = db.query(SkillGap).filter(
        SkillGap.resume_id == resume_id,
        SkillGap.user_id == current_user.id,
        SkillGap.target_role == selected_role
    ).first()

    if existing_gap:
        existing_gap.skill_match_percentage = analysis_data["skill_match_percentage"]
        existing_gap.matched_skills = analysis_data["matched_skills"]
        existing_gap.missing_skills = analysis_data["missing_skills"]
        existing_gap.all_extracted_skills = analysis_data["all_extracted_skills"]
        existing_gap.recommendations = analysis_data["recommendations"]
        gap_record = existing_gap
    else:
        gap_record = SkillGap(
            resume_id=resume.id,
            user_id=current_user.id,
            target_role=selected_role,
            skill_match_percentage=analysis_data["skill_match_percentage"],
            matched_skills=analysis_data["matched_skills"],
            missing_skills=analysis_data["missing_skills"],
            all_extracted_skills=analysis_data["all_extracted_skills"],
            recommendations=analysis_data["recommendations"]
        )
        db.add(gap_record)

    db.commit()
    db.refresh(gap_record)

    return gap_record

@router.get("/gap-analysis/{resume_id}", response_model=SkillGapResponse)
def get_skill_gap(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve existing skill gap analysis for a candidate's resume.
    Enforces multi-tenant isolation.
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access unauthorized."
        )

    gap = db.query(SkillGap).filter(
        SkillGap.resume_id == resume_id,
        SkillGap.user_id == current_user.id
    ).order_by(SkillGap.created_at.desc()).first()

    if not gap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No skill gap analysis found for this resume. Please trigger analysis first."
        )

    return gap
