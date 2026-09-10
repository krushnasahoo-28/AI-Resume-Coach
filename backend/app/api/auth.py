from typing import Union, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token
from app.utils.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user account.
    - Validates email & username uniqueness
    - Securely hashes user password
    - Returns sanitized user details
    """
    normalized_email = user_in.email.lower().strip()
    normalized_username = user_in.username.lower().strip()

    # Check duplicate email
    existing_email = db.query(User).filter(User.email == normalized_email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please use another email or log in."
        )

    # Check duplicate username
    existing_username = db.query(User).filter(User.username == normalized_username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken. Please choose a different username."
        )

    # Create new user
    new_user = User(
        full_name=user_in.full_name,
        email=normalized_email,
        username=normalized_username,
        password_hash=hash_password(user_in.password),
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and generate JWT access token.
    Supports both JSON payload ({ "username_or_email": "...", "password": "..." })
    and form data (OAuth2PasswordRequestForm).
    """
    identifier = ""
    password = ""

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            identifier = body.get("username_or_email") or body.get("username") or body.get("email", "")
            password = body.get("password", "")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload"
            )
    else:
        try:
            form = await request.form()
            identifier = form.get("username") or form.get("username_or_email", "")
            password = form.get("password", "")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid form data payload"
            )

    if not identifier or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username/email and password are required"
        )

    normalized_identifier = identifier.lower().strip()

    # Search user by email or username
    user = db.query(User).filter(
        (User.email == normalized_identifier) | (User.username == normalized_identifier)
    ).first()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive"
        )

    access_token = create_access_token(
        subject=user.id,
        extra_claims={"username": user.username}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retrieve currently authenticated user profile.
    Requires valid Bearer token header.
    """
    return current_user
