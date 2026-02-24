from typing import Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from app.models.billing import SubscriptionStatus, ActionType

class SubscriptionBase(BaseModel):
    stripe_subscription_id: Optional[str] = None
    status: SubscriptionStatus = SubscriptionStatus.INCOMPLETE

class SubscriptionCreate(SubscriptionBase):
    tenant_id: UUID

class Subscription(SubscriptionBase):
    tenant_id: UUID
    current_period_end: Optional[datetime] = None

    class Config:
        from_attributes = True

class UsageLogBase(BaseModel):
    action_type: ActionType
    timestamp: datetime = datetime.utcnow()
    tenant_id: UUID

class UsageLog(UsageLogBase):
    id: int

    class Config:
        from_attributes = True
