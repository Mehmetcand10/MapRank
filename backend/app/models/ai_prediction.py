from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from .base import Base

class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    
    keyword = Column(String, nullable=False)
    
    # Input scenario
    # { "added_reviews": 10, "stars": 5, "added_photos": 20, "faster_response": true }
    scenario_data = Column(JSON)
    
    # Results
    # { "prob_increase": 85, "estimated_rank_gain": 3.5, "new_est_position": 2 }
    prediction_results = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business", back_populates="predictions")
