from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Any, Dict
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

@router.post("/generate-response", response_model=schemas.ReplyDraftResponse)
def generate_review_response(
    request: schemas.ReplyDraftRequest,
    current_user: models.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    Generates a high-quality AI response for a customer review.
    """
    from app.services.ai_response_service import ai_response_service
    draft = ai_response_service.generate_response(
        review_text=request.review_text,
        rating=request.rating,
        author_name=request.author_name,
        tone=request.tone
    )
    return {"draft": draft}

@router.post("/analyze-sentiment")
def analyze_review_sentiment(
    review_text: str = Query(...),
    current_user: models.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    Analyzes the sentiment of a review text.
    """
    # Simple logic for now, could be expanded to a service
    positive_words = ["harika", "güzel", "lezzetli", "başarılı", "iyidi", "teşekkürler", "hızlı", "kalite"]
    negative_words = ["kötü", "yavaş", "soğuk", "pahalı", "berbat", "hiç", "yazık", "rezalet"]
    
    text_lower = review_text.lower()
    pos_count = sum(1 for w in positive_words if w in text_lower)
    neg_count = sum(1 for w in negative_words if w in text_lower)
    
    if pos_count > neg_count:
        return {"sentiment": "positive", "score": 0.8}
    elif neg_count > pos_count:
        return {"sentiment": "negative", "score": 0.2}
    else:
        return {"sentiment": "neutral", "score": 0.5}
