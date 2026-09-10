from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class ResumeImprovement(Base):
    __tablename__ = "resume_improvements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    overall_health_score = Column(Integer, nullable=False, default=70)
    suggestions = Column(JSON, nullable=False)
    section_recommendations = Column(JSON, nullable=False)
    metrics_summary = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    resume = relationship("Resume", back_populates="improvements")
    user = relationship("User")

    def __repr__(self):
        return f"<ResumeImprovement(id={self.id}, resume_id={self.resume_id}, score={self.overall_health_score})>"
