from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime, JSON, BigInteger, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from .base import Base

class Business(Base):
    __tablename__ = "businesses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    google_place_id = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    address = Column(String)
    total_rating = Column(Float)
    review_count = Column(Integer)
    is_my_business = Column(Boolean, default=False)
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="businesses")
    
    keywords = relationship("Keyword", back_populates="business", cascade="all, delete-orphan")
    rankings = relationship("Ranking", back_populates="business", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="business", cascade="all, delete-orphan")
    grid_snapshots = relationship("GridRankSnapshot", back_populates="business", cascade="all, delete-orphan")
    competitors = relationship("Competitor", back_populates="business", cascade="all, delete-orphan")
    seo_audits = relationship("SEOAudit", back_populates="business", cascade="all, delete-orphan")
    predictions = relationship("AIPrediction", back_populates="business", cascade="all, delete-orphan")
    
    # Profile Vitals (Cached/Persisted for history)
    health_score = Column(Float, default=0.0)
    profile_completeness = Column(Float, default=0.0)
    last_audit_date = Column(DateTime)

class Keyword(Base):
    __tablename__ = "keywords"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    term = Column(String, nullable=False)
    location = Column(String, nullable=False)
    
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"))
    business = relationship("Business", back_populates="keywords")
    
    rankings = relationship("Ranking", back_populates="keyword", cascade="all, delete-orphan")

class Ranking(Base):
    __tablename__ = "rankings"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    rank_position = Column(Integer)
    competitors_json = Column(JSON) # Stores list of competitor data
    snapshot_date = Column(DateTime, default=datetime.utcnow)
    score = Column(Float) # MapRank score

    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"))
    business = relationship("Business", back_populates="rankings")

    keyword_id = Column(UUID(as_uuid=True), ForeignKey("keywords.id", ondelete="CASCADE"))
    keyword = relationship("Keyword", back_populates="rankings")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String) # critical, info, success, warning
    title = Column(String)
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"))
    business = relationship("Business", back_populates="alerts")
