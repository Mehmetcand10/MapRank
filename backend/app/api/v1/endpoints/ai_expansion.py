from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Any
from app import schemas, models
from app.api import deps, auth_deps
from app.services.ai_expansion_service import seo_audit_service, competitor_service
from app.services.description_service import ai_description_service
from uuid import UUID

router = APIRouter()

@router.post("/{business_id}/seo-audit", response_model=schemas.SEOAuditOutput)
def run_seo_audit(
    business_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    Runs a Local SEO audit for a business.
    """
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.tenant_id == current_user.tenant_id
    ).first()
    
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    try:
        audit = seo_audit_service.run_audit(db, business)
        return audit
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{business_id}/discover-competitors", response_model=List[schemas.CompetitorOutput])
def discover_competitors(
    business_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    Automatically discovers and tracks competitors for a business.
    """
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.tenant_id == current_user.tenant_id
    ).first()
    
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    try:
        competitors = competitor_service.discover_and_track_competitors(db, business)
        return competitors
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{business_id}/competitors", response_model=List[schemas.CompetitorOutput])
def list_competitors(
    business_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    Lists tracked competitors for a business.
    """
    return db.query(models.Competitor).filter(models.Competitor.business_id == business_id).all()

@router.post("/generate-description", response_model=schemas.DescriptionResponse)
def generate_business_description(
    request: schemas.DescriptionRequest,
    current_user: models.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    Generates an AI-optimized GMB description.
    """
    desc = ai_description_service.generate_description(
        business_name="İşletmeniz",
        category=request.category,
        location=request.location,
        keywords=request.keywords,
        tone=request.tone
    )
    return {"description": desc}

@router.post("/{business_id}/predict", response_model=schemas.AIPredictionOutput)
def run_prediction_simulation(
    business_id: UUID,
    keyword: str,
    scenario: Dict[str, Any],
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    Simulates ranking impact of specific actions.
    """
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.tenant_id == current_user.tenant_id
    ).first()
    
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    from app.services.ai_prediction_service import ai_prediction_service
    prediction = ai_prediction_service.predict_impact(db, business, keyword, scenario)
    return prediction

@router.get("/{business_id}/strategy-analysis")
def get_competitor_strategy_analysis(
    business_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    AI analysis of competitor strategies vs yours.
    """
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.tenant_id == current_user.tenant_id
    ).first()
    
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    competitors = db.query(models.Competitor).filter(models.Competitor.business_id == business_id).all()
    
    from app.services.competitor_intel_service import competitor_intelligence_service
    analysis = competitor_intelligence_service.analyze_strategy(business, competitors)
    return analysis

@router.get("/benchmarks")
def get_industry_benchmarks(
    category: str,
    location: str,
    current_user: models.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    Get city/industry wide benchmarks.
    """
    from app.services.competitor_intel_service import competitor_intelligence_service
    return competitor_intelligence_service.get_benchmarks(category, location)
