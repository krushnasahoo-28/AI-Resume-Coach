from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.interview import Interview
from app.schemas.interview import (
    InterviewStartRequest,
    InterviewStartResponse,
    InterviewQuestionItem,
    AnswerSubmitRequest,
    AnswerSubmitResponse,
    InterviewSummaryResponse
)
from app.dependencies import get_current_user
from app.services.interview_engine import (
    generate_interview_questions,
    evaluate_user_answer,
    calculate_interview_final_results
)

router = APIRouter(prefix="/interviews", tags=["AI Mock Technical Interview Engine"])

@router.post("/start", response_model=InterviewStartResponse, status_code=status.HTTP_201_CREATED)
def start_interview_session(
    request: InterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initialize an interactive mock interview session.
    - Requires JWT authentication
    - Strictly verifies resume ownership (resume.user_id == current_user.id)
    - Generates questions tailored to role, resume skills, and difficulty
    """
    # 1. Verify resume ownership
    resume = db.query(Resume).filter(
        Resume.id == request.resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access unauthorized."
        )

    # 2. Generate questions
    questions = generate_interview_questions(
        resume_text=resume.extracted_text or "",
        target_role=request.target_role,
        difficulty=request.difficulty,
        count=request.total_questions
    )

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate interview questions."
        )

    # 3. Create Interview session DB record
    new_interview = Interview(
        user_id=current_user.id,
        resume_id=resume.id,
        target_role=request.target_role,
        difficulty=request.difficulty,
        total_questions=len(questions),
        questions=questions,
        answers=[],
        status="in_progress"
    )

    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)

    first_q = questions[0]
    first_question_item = InterviewQuestionItem(
        question_index=first_q["question_index"],
        question_text=first_q["question_text"],
        category=first_q["category"],
        difficulty=first_q["difficulty"]
    )

    return InterviewStartResponse(
        interview_id=new_interview.id,
        resume_id=new_interview.resume_id,
        target_role=new_interview.target_role,
        difficulty=new_interview.difficulty,
        total_questions=new_interview.total_questions,
        current_question_index=1,
        first_question=first_question_item
    )

@router.post("/{interview_id}/answer", response_model=AnswerSubmitResponse)
def submit_interview_answer(
    interview_id: int,
    request: AnswerSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit answer for a specific question in an active interview session.
    - Evaluates correctness, completeness, clarity, technical understanding
    - Returns feedback, score, and next question if available
    """
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found or access unauthorized."
        )

    if interview.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview session is already completed."
        )

    questions = interview.questions or []
    if request.question_index < 1 or request.question_index > len(questions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid question index {request.question_index}. Total questions: {len(questions)}."
        )

    target_q = questions[request.question_index - 1]

    # Evaluate answer
    feedback_dict = evaluate_user_answer(target_q, request.answer_text)

    # Update answers list in DB
    existing_answers = list(interview.answers or [])
    # Replace if answer for this index already submitted, else append
    existing_answers = [a for a in existing_answers if a.get("question_index") != request.question_index]
    existing_answers.append(feedback_dict)
    existing_answers.sort(key=lambda x: x.get("question_index", 0))

    interview.answers = existing_answers
    db.commit()
    db.refresh(interview)

    is_completed = len(existing_answers) >= interview.total_questions

    # Auto-finish if all answered
    if is_completed:
        finish_interview_session(interview_id=interview.id, current_user=current_user, db=db)
        db.refresh(interview)

    next_q_item = None
    if not is_completed and request.question_index < len(questions):
        next_q_raw = questions[request.question_index]
        next_q_item = InterviewQuestionItem(
            question_index=next_q_raw["question_index"],
            question_text=next_q_raw["question_text"],
            category=next_q_raw["category"],
            difficulty=next_q_raw["difficulty"]
        )

    return AnswerSubmitResponse(
        interview_id=interview.id,
        question_index=request.question_index,
        feedback=feedback_dict,
        is_completed=is_completed,
        next_question=next_q_item
    )

@router.post("/{interview_id}/finish", response_model=InterviewSummaryResponse)
def finish_interview_session(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Finish interview session, calculate overall scores, technical score,
    communication score, and summary recommendations.
    """
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found or access unauthorized."
        )

    answers = interview.answers or []
    summary_data = calculate_interview_final_results(answers, interview.target_role)

    interview.status = "completed"
    interview.overall_score = summary_data["overall_score"]
    interview.technical_score = summary_data["technical_score"]
    interview.communication_score = summary_data["communication_score"]
    interview.summary_feedback = summary_data

    db.commit()
    db.refresh(interview)

    return interview

@router.get("/{interview_id}", response_model=InterviewSummaryResponse)
def get_interview_session(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve interview session details, question breakdown, and scores.
    Enforces JWT authentication & multi-tenant isolation.
    """
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found or access unauthorized."
        )

    return interview
