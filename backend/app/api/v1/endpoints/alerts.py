from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import schemas, models
from app.api import deps, auth_deps
from uuid import UUID

router = APIRouter()

@router.get("", response_model=List[schemas.Alert])
def list_alerts(
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(auth_deps.get_current_user)
):
    """
    List all alerts for businesses owned by the tenant.
    """
    alerts = db.query(models.Alert).join(models.Business).filter(
        models.Business.tenant_id == current_user.tenant_id
    ).order_by(models.Alert.created_at.desc()).all()
    return alerts

@router.post("/{alert_id}/read")
def mark_alert_as_read(
    alert_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(auth_deps.get_current_user)
):
    alert = db.query(models.Alert).join(models.Business).filter(
        models.Alert.id == alert_id,
        models.Business.tenant_id == current_user.tenant_id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı.")
    
    alert.is_read = True
    db.commit()
    return {"message": "Success"}
