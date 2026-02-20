from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.api import deps
from app.services.tenant_service import tenant_service
from app.models.user import User  # For type checking if needed

router = APIRouter()

@router.get("/me", response_model=schemas.Tenant)
def read_tenant_me(
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current tenant.
    """
    tenant = tenant_service.get(db, tenant_id=current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.put("/me", response_model=schemas.Tenant)
def update_tenant_me(
    *,
    db: Session = Depends(deps.get_db),
    tenant_in: schemas.TenantUpdate,
    current_user: schemas.User = Depends(deps.get_current_user),
) -> Any:
    """
    Update current tenant.
    """
    tenant = tenant_service.get(db, tenant_id=current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Only Owner or Admin can update tenant settings
    if str(current_user.role) not in ["OWNER", "ADMIN"]:
         raise HTTPException(status_code=403, detail="Not enough permissions")

    tenant = tenant_service.update(db, db_obj=tenant, obj_in=tenant_in)
    return tenant

@router.get("/users", response_model=List[schemas.User])
def read_tenant_users(
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get users in current tenant.
    """
    tenant = tenant_service.get(db, tenant_id=current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    return tenant.users
