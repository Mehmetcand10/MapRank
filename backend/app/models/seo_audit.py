from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from .base import Base

class SEOAudit(Base):
    __tablename__ = "seo_audits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    
    overall_score = Column(Float)
    
    # JSON structure storing detailed checks
    # { 
    #   "category": {"score": 80, "impact": "High", "suggestion": "..."},
    #   "photos": {...},
    #   "reviews": {...}
    # }
    audit_data = Column(JSON)
    
    # Recommendations for AI
    ai_recommendations = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business", back_populates="seo_audits")
