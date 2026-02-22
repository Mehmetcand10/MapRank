from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class BusinessBase(BaseModel):
    name: str
    address: Optional[str] = None
    google_place_id: str
    total_rating: Optional[float] = 0.0
    review_count: Optional[int] = 0
    is_my_business: bool = False

class BusinessCreate(BusinessBase):
    pass

class BusinessSearchResult(BaseModel):
    google_place_id: str
    name: str
    address: str
    rating: float
    user_ratings_total: int

class Ranking(BaseModel):
    id: int
    rank_position: Optional[int]
    score: Optional[float]
    snapshot_date: datetime
    competitors_json: Optional[List[Dict[str, Any]]]

    class Config:
        orm_mode = True

class Business(BusinessBase):
    id: UUID
    tenant_id: UUID
    latest_ranking: Optional[Ranking] = None

    class Config:
        orm_mode = True

class Recommendation(BaseModel):
    type: str # critical, warning, suggestion
    message: str

class BusinessAnalysis(BaseModel):
    score: float
    metrics: dict
    targets: dict
    recommendations: List[Recommendation]
    analysis_text: str
    formatted_address: Optional[str] = None
    formatted_phone_number: Optional[str] = None
    website: Optional[str] = None
    photo_url: Optional[str] = None
    validation_status: str = "Unknown" # Claimed, Unclaimed, etc.
    competitors: List[Dict[str, Any]] = []
    is_tracked: bool = False
    
    # Advanced Metrics
    review_velocity_30d: Optional[float] = 0.0
    owner_response_rate: Optional[float] = 0.0
    response_speed_hours: Optional[float] = 0.0
    photo_count: Optional[int] = 0
    profile_completeness_percent: Optional[float] = 0.0
    keyword_relevance_score: Optional[float] = 0.0
    competitor_keywords: Optional[List[Dict[str, Any]]] = None
    
    # Premium Fields
    sentiment_trends: Optional[List[Dict[str, Any]]] = None
    visibility_score: Optional[float] = None
    market_share_estimate: Optional[float] = None
    growth_hacks: Optional[List[str]] = None
    sector_benchmarks: Optional[Dict[str, Any]] = None
