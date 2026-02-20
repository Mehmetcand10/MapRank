from typing import Optional
from pydantic import BaseModel
from uuid import UUID

class TenantBase(BaseModel):
    name: str

class TenantCreate(TenantBase):
    pass

class TenantUpdate(TenantBase):
    name: Optional[str] = None

class TenantInDBBase(TenantBase):
    id: UUID
    plan_type: str = "FREE"

    class Config:
        orm_mode = True

class Tenant(TenantInDBBase):
    pass
