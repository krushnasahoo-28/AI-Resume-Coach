from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.schemas.resume import ResumeResponse, ResumeListItem
from app.dependencies import get_current_user
from app.services.resume_parser import parse_resume_file

router = APIRouter(prefix="/resumes", tags=["Resumes"])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB limit
ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/octet-stream"
}

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and parse PDF or DOCX resume file.
    - Enforces 5 MB file size limit
    - Enforces .pdf / .docx format validation
    - Extracts text statelessly without permanent filesystem storage
    - Restricts access strictly to the authenticated user
    """
    filename = file.filename or ""
    lower_filename = filename.lower()
    
    # 1. Validate Extension
    ext = "." + lower_filename.split(".")[-1] if "." in lower_filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Only PDF (.pdf) and DOCX (.docx) files are supported."
        )

    # 2. Validate MIME type
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid MIME type '{content_type}'. Please upload a valid PDF or Word document."
        )

    # 3. Read bytes into memory
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading uploaded file: {str(e)}"
        )

    # 4. Validate non-empty file
    file_size = len(file_bytes)
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    # 5. Validate file size limit (5 MB)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size ({round(file_size / (1024 * 1024), 2)} MB) exceeds maximum allowed limit of 5 MB."
        )

    # 6. Parse extracted text
    extracted_text = parse_resume_file(file_bytes, filename, content_type)

    # 7. Create database record linked to current user
    new_resume = Resume(
        user_id=current_user.id,
        original_filename=filename,
        file_type=content_type if content_type != "application/octet-stream" else f"application/{ext[1:]}",
        file_size=file_size,
        extracted_text=extracted_text
    )

    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    return new_resume

@router.get("", response_model=List[ResumeListItem])
def list_user_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all resumes belonging strictly to the authenticated user.
    """
    resumes = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.created_at.desc()).all()
    return resumes

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve single resume details including extracted text preview.
    Enforces multi-tenant isolation (returns 404 if resume belongs to another user).
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

    return resume

@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete resume record belonging strictly to the authenticated user.
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

    db.delete(resume)
    db.commit()

    return {"message": f"Resume '{resume.original_filename}' deleted successfully."}
