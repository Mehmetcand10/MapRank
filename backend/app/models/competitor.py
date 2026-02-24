from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from .base import Base

class Competitor(Base):
    __tablename__ = "competitors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    
    # Mirroring some Google Data for easy access without constant API calls
    google_place_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    address = Column(String)
    rating = Column(Float)
    review_count = Column(Integer)
    photo_count = Column(Integer, default=0)
    response_rate = Column(Float, default=0.0)
    
    # Discovery related
    discovery_type = Column(String) # auto, manual
    is_tracked = Column(Boolean, default=True)
    
    # Metrics
    visibility_score = Column(Float, default=0.0)
    review_velocity_30d = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business = relationship("Business", back_populates="competitors", foreign_keys=[business_id])
