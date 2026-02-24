from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class ReportBase(BaseModel):
    title: str
    business_id: UUID

class ReportCreate(ReportBase):
    pass

class Report(ReportBase):
    id: UUID
    created_at: datetime
    content_json: Dict[str, Any]

    class Config:
        from_attributes = True
