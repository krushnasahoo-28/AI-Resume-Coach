from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.analysis import ResumeAnalysis
from app.models.skill_gap import SkillGap
from app.models.job import Job
from app.models.improver import ResumeImprovement
from app.models.interview import Interview
from app.dependencies import get_current_user
from app.services.job_matcher import calculate_job_match

router = APIRouter(prefix="/dashboard", tags=["Candidate Dashboard"])

@router.get("/summary", response_model=Dict[str, Any])
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unified dashboard aggregation endpoint.
    - Requires JWT authentication
    - Restricts metrics strictly to current_user
    - Returns user statistics, resume overview, ATS analysis, skill gap, job matching,
      resume improvement, interview metrics, and recent activity timeline.
    """
    # 1. User Resumes
    user_resumes = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.created_at.desc()).all()

    resumes_count = len(user_resumes)
    latest_resume_dict = None
    if user_resumes:
        lr = user_resumes[0]
        latest_resume_dict = {
            "id": lr.id,
            "filename": lr.original_filename,
            "created_at": lr.created_at.isoformat()
        }

    # 2. Latest ATS Analysis
    latest_ats_analysis = None
    if user_resumes:
        analysis = db.query(ResumeAnalysis).filter(
            ResumeAnalysis.user_id == current_user.id
        ).order_by(ResumeAnalysis.created_at.desc()).first()
        if analysis:
            latest_ats_analysis = {
                "overall_score": analysis.overall_score,
                "target_role": analysis.target_role,
                "created_at": analysis.created_at.isoformat()
            }

    # 3. Latest Skill Gap Analysis
    latest_skill_gap = None
    if user_resumes:
        gap = db.query(SkillGap).filter(
            SkillGap.user_id == current_user.id
        ).order_by(SkillGap.created_at.desc()).first()
        if gap:
            latest_skill_gap = {
                "target_role": gap.target_role,
                "skill_match_percentage": gap.skill_match_percentage,
                "matched_count": len(gap.matched_skills or []),
                "missing_count": len(gap.missing_skills or [])
            }

    # 4. Job Matching Summary
    job_matching_summary = {
        "total_jobs_in_db": db.query(Job).count(),
        "top_match_title": "Software Engineer",
        "top_match_company": "TechCorp Solutions",
        "best_match_percentage": 0
    }
    if user_resumes and user_resumes[0].extracted_text:
        sample_jobs = db.query(Job).limit(10).all()
        if sample_jobs:
            matches = [
                calculate_job_match(user_resumes[0].extracted_text, {
                    "id": j.id,
                    "company": j.company,
                    "title": j.title,
                    "location": j.location,
                    "description": j.description,
                    "required_skills": j.required_skills,
                    "preferred_skills": j.preferred_skills,
                    "experience": j.experience,
                    "category": j.category
                }) for j in sample_jobs
            ]
            matches.sort(key=lambda x: x["match_percentage"], reverse=True)
            if matches:
                top_m = matches[0]
                job_matching_summary["top_match_title"] = top_m["title"]
                job_matching_summary["top_match_company"] = top_m["company"]
                job_matching_summary["best_match_percentage"] = top_m["match_percentage"]

    # 5. Latest Resume Improvement
    latest_improvement = None
    if user_resumes:
        imp = db.query(ResumeImprovement).filter(
            ResumeImprovement.user_id == current_user.id
        ).order_by(ResumeImprovement.created_at.desc()).first()
        if imp:
            latest_improvement = {
                "overall_health_score": imp.overall_health_score,
                "total_suggestions": len(imp.suggestions or []),
                "action_verb_count": imp.metrics_summary.get("action_verb_count", 0) if imp.metrics_summary else 0
            }

    # 6. Mock Interview Summary
    user_interviews = db.query(Interview).filter(
        Interview.user_id == current_user.id
    ).order_by(Interview.created_at.desc()).all()

    completed_interviews = [i for i in user_interviews if i.status == "completed"]
    latest_interview_dict = None
    if completed_interviews:
        li = completed_interviews[0]
        latest_interview_dict = {
            "total_completed": len(completed_interviews),
            "latest_score": li.overall_score,
            "target_role": li.target_role,
            "strong_areas": li.summary_feedback.get("strong_areas", []) if li.summary_feedback else [],
            "weak_areas": li.summary_feedback.get("weak_areas", []) if li.summary_feedback else []
        }
    elif user_interviews:
        latest_interview_dict = {
            "total_completed": 0,
            "latest_score": None,
            "target_role": user_interviews[0].target_role,
            "strong_areas": [],
            "weak_areas": []
        }

    # 7. Recent Activity Timeline
    activity_items = []
    for r in user_resumes[:3]:
        activity_items.append({
            "type": "resume_upload",
            "title": f"Uploaded '{r.original_filename}'",
            "timestamp": r.created_at.isoformat()
        })
    for i in user_interviews[:3]:
        activity_items.append({
            "type": "mock_interview",
            "title": f"Interview Session ({i.target_role}) - Score: {i.overall_score or 'In Progress'}",
            "timestamp": i.created_at.isoformat()
        })

    activity_items.sort(key=lambda x: x["timestamp"], reverse=True)

    return {
        "user_name": current_user.full_name,
        "username": current_user.username,
        "email": current_user.email,
        "resumes_count": resumes_count,
        "latest_resume": latest_resume_dict,
        "latest_ats_analysis": latest_ats_analysis,
        "latest_skill_gap": latest_skill_gap,
        "job_matching_summary": job_matching_summary,
        "latest_improvement": latest_improvement,
        "interview_summary": latest_interview_dict,
        "recent_activity": activity_items[:5]
    }
