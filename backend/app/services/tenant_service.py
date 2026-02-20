from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate, TenantUpdate

class TenantService:
    def get(self, db: Session, tenant_id: str) -> Optional[Tenant]:
        return db.query(Tenant).filter(Tenant.id == tenant_id).first()

    def create(self, db: Session, obj_in: TenantCreate) -> Tenant:
        db_obj = Tenant(name=obj_in.name)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Tenant, obj_in: TenantUpdate) -> Tenant:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

tenant_service = TenantService()
