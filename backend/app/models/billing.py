from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from .base import Base

class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    INCOMPLETE = "incomplete"

class ActionType(str, enum.Enum):
    SEARCH = "SEARCH"
    REPORT = "REPORT"
    ANALYZE = "ANALYZE"

class Subscription(Base):
    __tablename__ = "subscriptions"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), primary_key=True)
    stripe_subscription_id = Column(String, unique=True)
    current_period_end = Column(DateTime)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.INCOMPLETE)
    
    # Optional: Link back to tenant if needed explicitly, but tenant_id is PK/FK
    # tenant = relationship("Tenant", backref=backref("subscription", uselist=False))

class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    action_type = Column(Enum(ActionType), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"))
