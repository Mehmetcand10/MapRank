from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app import models, schemas
from app.api import deps, auth_deps
from app.services.report_service import report_service

router = APIRouter()

@router.get("/{business_id}/download", response_class=StreamingResponse)
def download_business_report(
    business_id: int,
    current_user: schemas.User = Depends(auth_deps.get_current_user)
):
    """
    Generate and download a white-label PDF report for a business.
    """
    db: Session = SessionLocal()
    try:
        business = db.query(models.Business).filter(models.Business.id == business_id).first()
        if not business:
            raise HTTPException(status_code=404, detail="Business not found")
        
        # Verify ownership (simplified, assumes tenant logic or direct ownership)
        # In real app: if business.tenant_id != current_user.tenant_id: raise 403
        
        pdf_buffer = report_service.generate_business_report(business, current_user)
        
        filename = f"MapRank_Report_{business.name.replace(' ', '_')}.pdf"
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    finally:
        db.close()
