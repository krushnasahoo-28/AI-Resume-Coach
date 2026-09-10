from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.analysis import ResumeAnalysis
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.dependencies import get_current_user
from app.services.ats_analyzer import analyze_resume_ats

router = APIRouter(prefix="/analysis", tags=["ATS Analysis"])

@router.post("/resume/{resume_id}", response_model=AnalysisResponse, status_code=status.HTTP_200_OK)
def analyze_resume(
    resume_id: int,
    request: Optional[AnalysisRequest] = None,
    target_role: Optional[str] = Query("Software Engineer", description="Target job role for ATS skill matching"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Perform ATS compatibility analysis on an uploaded resume.
    - Requires JWT authentication
    - Verifies resume ownership (rejects unauthorized access to other candidates' resumes)
    - Calculates 0-100 ATS score and category breakdown
    - Stores/updates analysis results in PostgreSQL
    """
    # Extract target_role from request body if available, else query param
    selected_role = "Software Engineer"
    if request and request.target_role:
        selected_role = request.target_role
    elif target_role:
        selected_role = target_role

    # 1. Fetch resume and enforce tenant isolation
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
            detail="Resume extracted text is empty. Unable to perform ATS analysis."
        )

    # 3. Execute ATS scoring algorithm
    analysis_data = analyze_resume_ats(resume.extracted_text, selected_role)

    # 4. Check if existing analysis record exists for this resume & target role
    existing_analysis = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.resume_id == resume_id,
        ResumeAnalysis.user_id == current_user.id,
        ResumeAnalysis.target_role == selected_role
    ).first()

    if existing_analysis:
        existing_analysis.overall_score = analysis_data["overall_score"]
        existing_analysis.category_scores = analysis_data["category_scores"]
        existing_analysis.detected_skills = analysis_data["detected_skills"]
        existing_analysis.strengths = analysis_data["strengths"]
        existing_analysis.weaknesses = analysis_data["weaknesses"]
        existing_analysis.suggestions = analysis_data["suggestions"]
        analysis_record = existing_analysis
    else:
        analysis_record = ResumeAnalysis(
            resume_id=resume.id,
            user_id=current_user.id,
            target_role=selected_role,
            overall_score=analysis_data["overall_score"],
            category_scores=analysis_data["category_scores"],
            detected_skills=analysis_data["detected_skills"],
            strengths=analysis_data["strengths"],
            weaknesses=analysis_data["weaknesses"],
            suggestions=analysis_data["suggestions"]
        )
        db.add(analysis_record)

    db.commit()
    db.refresh(analysis_record)

    return analysis_record

@router.get("/resume/{resume_id}", response_model=AnalysisResponse)
def get_resume_analysis(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve existing ATS analysis for a candidate's resume.
    Enforces multi-tenant isolation.
    """
    # Verify resume ownership
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access unauthorized."
        )

    analysis = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.resume_id == resume_id,
        ResumeAnalysis.user_id == current_user.id
    ).order_by(ResumeAnalysis.created_at.desc()).first()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No ATS analysis found for this resume. Please trigger an analysis first."
        )

    return analysis
