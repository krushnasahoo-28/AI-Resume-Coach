from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    target_role = Column(String(100), nullable=False)
    difficulty = Column(String(50), nullable=False, default="Medium")
    total_questions = Column(Integer, nullable=False, default=5)
    questions = Column(JSON, nullable=False)  # List of question dicts
    answers = Column(JSON, nullable=False, default=list)  # List of answer & feedback dicts
    status = Column(String(50), nullable=False, default="in_progress")  # in_progress, completed
    overall_score = Column(Integer, nullable=True)
    technical_score = Column(Integer, nullable=True)
    communication_score = Column(Integer, nullable=True)
    summary_feedback = Column(JSON, nullable=True)  # strong_areas, weak_areas, study_recommendations
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    resume = relationship("Resume", back_populates="interviews")
    user = relationship("User")

    def __repr__(self):
        return f"<Interview(id={self.id}, user_id={self.user_id}, role='{self.target_role}', status='{self.status}')>"
