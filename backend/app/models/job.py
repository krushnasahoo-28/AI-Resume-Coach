from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company = Column(String(100), nullable=False)
    title = Column(String(150), nullable=False)
    location = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    required_skills = Column(JSON, nullable=False)
    preferred_skills = Column(JSON, nullable=False)
    experience = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Job(id={self.id}, company='{self.company}', title='{self.title}')>"
