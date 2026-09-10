from datetime import datetime
from typing import Optional
from pydantic import BaseModel, computed_field

class ResumeBase(BaseModel):
    original_filename: str
    file_type: str
    file_size: int

class ResumeResponse(ResumeBase):
    id: int
    user_id: int
    extracted_text: str
    created_at: datetime

    @computed_field
    @property
    def text_preview(self) -> str:
        """
        Returns a truncated preview of the extracted text (up to 300 chars).
        """
        if not self.extracted_text:
            return ""
        clean = self.extracted_text.strip()
        if len(clean) > 300:
            return clean[:300] + "..."
        return clean

    class Config:
        from_attributes = True

class ResumeListItem(ResumeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
