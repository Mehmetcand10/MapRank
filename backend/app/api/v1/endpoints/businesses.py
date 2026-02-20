from typing import List, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, models
from app.api import deps, auth_deps
from app.services.google_maps import google_maps_service
from app.services.ranking_engine import ranking_engine

router = APIRouter()

@router.get("/search", response_model=List[schemas.BusinessSearchResult])
def search_businesses(
    query: str,
    location: str = "Turkey",
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    Search businesses via Google Maps API.
    """
    results = google_maps_service.search_business(query, location)
    if not results:
        return []
    
    # Calculate initial scores for search results just for preview
    for result in results:
        result["maprank_score"] = ranking_engine.calculate_score(result)
        
    return results

@router.post("/analyze", response_model=schemas.BusinessAnalysis)
def analyze_business_endpoint(
    place_id: str,
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    Get detailed analysis for a specific business.
    """
    # Clean place_id if it contains a suffix like :1
    if ":" in place_id:
        place_id = place_id.split(":")[0]

    # 1. Fetch detailed data from Google Maps
    details = google_maps_service.get_place_details(place_id)
    
    if not details:
        raise HTTPException(status_code=404, detail="Business details not found")
        
    # 2. Run Analysis
    analysis = ranking_engine.analyze_business(details)
    
    # 3. Check if business is already tracked by this user/tenant
    exists = db.query(models.Business).filter(
        models.Business.google_place_id == place_id,
        models.Business.tenant_id == current_user.tenant_id
    ).first()
    
    if exists:
        analysis["is_tracked"] = True
    else:
        analysis["is_tracked"] = False
    
    return analysis

@router.post("/", response_model=schemas.Business)
def create_business(
    business_in: schemas.BusinessCreate,
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    Create/Save a business to the user's tenant.
    """
    if current_user.role != "OWNER":
        raise HTTPException(status_code=400, detail="Only owners can add businesses")

    # Check if business already exists for this tenant
    existing_business = db.query(models.Business).filter(
        models.Business.google_place_id == business_in.google_place_id,
        models.Business.tenant_id == current_user.tenant_id
    ).first()
    
    if existing_business:
        raise HTTPException(status_code=400, detail="Business already exists in this tenant")
        
    # Fetch details to populate fields
    details = google_maps_service.get_place_details(business_in.google_place_id)
    if not details:
        raise HTTPException(status_code=404, detail="Business not found on Google Maps")
        
    # Run initial analysis to get score/ranking
    analysis = ranking_engine.analyze_business(details)
    
    try:
        # Create Business instance
        db_business = models.Business(
            google_place_id=business_in.google_place_id,
            name=details.get("name", business_in.name),
            address=details.get("formatted_address"),
            total_rating=details.get("rating"),
            review_count=details.get("user_ratings_total"),
            tenant_id=current_user.tenant_id
        )
        db.add(db_business)
        db.commit()
        db.refresh(db_business)
        
        # Create initial Ranking snapshot
        db_ranking = models.Ranking(
            business_id=db_business.id,
            rank_position=analysis.get("metrics", {}).get("rank_position"), 
            score=analysis.get("score"),
            competitors_json=analysis.get("competitors"), 
            snapshot_date=datetime.utcnow() # Force current time
        )
        db.add(db_ranking)
        db.commit()
        
        return db_business
    except Exception as e:
        print(f"Error saving business: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[schemas.Business])
def list_businesses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    Retrieve businesses for the current tenant.
    """
    businesses = db.query(models.Business).filter(
        models.Business.tenant_id == current_user.tenant_id
    ).offset(skip).limit(limit).all()
    
    # Populate latest_ranking
    for business in businesses:
        if business.rankings:
            # Sort by snapshot_date desc
            latest = sorted(business.rankings, key=lambda x: x.snapshot_date, reverse=True)[0]
            business.latest_ranking = latest
            
    return businesses
