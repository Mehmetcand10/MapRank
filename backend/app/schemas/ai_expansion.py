from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

# --- SEO Audit Schemas ---
class SEOAuditBase(BaseModel):
    overall_score: float
    audit_data: Dict[str, Any]
    ai_recommendations: List[Dict[str, Any]]

class SEOAuditOutput(SEOAuditBase):
    id: UUID
    business_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# --- Competitor Schemas ---
class CompetitorBase(BaseModel):
    google_place_id: str
    name: str
    address: Optional[str]
    rating: Optional[float]
    review_count: Optional[int]
    discovery_type: str = "auto"
    is_tracked: bool = True
    visibility_score: float = 0.0

class CompetitorOutput(CompetitorBase):
    id: UUID
    business_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- AI Prediction Schemas ---
class AIPredictionBase(BaseModel):
    keyword: str
    scenario_data: Dict[str, Any]

class AIPredictionOutput(AIPredictionBase):
    id: UUID
    business_id: UUID
    prediction_results: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Description Gen Schemas ---
class DescriptionRequest(BaseModel):
    category: str
    location: str
    keywords: List[str]
    tone: str = "professional"

class DescriptionResponse(BaseModel):
    description: str
