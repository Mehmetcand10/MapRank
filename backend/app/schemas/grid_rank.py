from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class GridPointOutput(BaseModel):
    lat: float
    lng: float
    rank: Optional[int]
    is_competitor_winner: Optional[str]
    point_metadata: Optional[dict]

class GridRankBase(BaseModel):
    keyword: str
    radius_km: float = 1.0
    grid_size: int = 5

class GridRankCreate(GridRankBase):
    pass

class GridRankSnapshot(GridRankBase):
    id: UUID
    business_id: UUID
    center_lat: float
    center_lng: float
    average_rank: Optional[float]
    visibility_score: Optional[float]
    created_at: datetime
    points: List[GridPointOutput]

    class Config:
        from_attributes = True

class GridRankHistory(BaseModel):
    snapshots: List[GridRankSnapshot]
