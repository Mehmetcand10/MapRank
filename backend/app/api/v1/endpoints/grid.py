from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Any
from app import schemas, models
from app.api import deps, auth_deps
from app.services.grid_service import grid_service
from uuid import UUID

router = APIRouter()

@router.post("/{business_id}/analyze", response_model=schemas.GridRankSnapshot)
def run_grid_analysis(
    business_id: UUID,
    keyword: str,
    radius_km: float = Query(1.0, gt=0, lt=10),
    grid_size: int = Query(5, ge=3, le=9),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    Run a new grid ranking analysis for a business.
    """
    # 1. Check if business exists and belongs to user's tenant
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.tenant_id == current_user.tenant_id
    ).first()
    
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    try:
        # 2. Trigger analysis
        snapshot = grid_service.run_analysis(
            db=db,
            business=business,
            keyword=keyword,
            radius_km=radius_km,
            grid_size=grid_size
        )
        return snapshot
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Grid analysis error: {str(e)}")

@router.get("/{business_id}/history", response_model=List[schemas.GridRankSnapshot])
def get_grid_history(
    business_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    Get history of grid ranking snapshots for a business.
    """
    # 1. Check permission
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.tenant_id == current_user.tenant_id
    ).first()
    
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    return grid_service.get_history(db, business_id=business_id)
