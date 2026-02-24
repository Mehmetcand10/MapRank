from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from .base import Base

class GridRankSnapshot(Base):
    __tablename__ = "grid_rank_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    keyword = Column(String, nullable=False)
    radius_km = Column(Float, default=1.0)
    grid_size = Column(Integer, default=5) # 5x5, 7x7 etc.
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    average_rank = Column(Float, nullable=True)
    visibility_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business", back_populates="grid_snapshots")
    points = relationship("GridPointRank", back_populates="snapshot", cascade="all, delete-orphan")

class GridPointRank(Base):
    __tablename__ = "grid_point_ranks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    snapshot_id = Column(UUID(as_uuid=True), ForeignKey("grid_rank_snapshots.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    rank = Column(Integer, nullable=True) # 0 or null if not in top 20
    is_competitor_winner = Column(String, nullable=True) # Name of the winner if not our business
    metadata = Column(JSON, nullable=True) # Extra info like competitor ratings at this spot

    snapshot = relationship("GridRankSnapshot", back_populates="points")
