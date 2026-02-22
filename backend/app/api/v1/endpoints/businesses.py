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

@router.get("/public-report", response_model=schemas.BusinessAnalysis)
def get_public_report(
    place_id: str,
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Get public detailed analysis for a specific business (No Auth Required for sharing).
    """
    if ":" in place_id:
        place_id = place_id.split(":")[0]

    details = google_maps_service.get_place_details(place_id)
    if not details:
        raise HTTPException(status_code=404, detail="Business details not found")
        
    analysis = ranking_engine.analyze_business(details)
    analysis["is_tracked"] = False # Public view doesn't imply tracking status
    
    return analysis

@router.post("", response_model=schemas.Business)
def create_business(
    business_in: schemas.BusinessCreate,
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(auth_deps.get_current_user)
) -> Any:
    """
    Create/Save a business to the user's tenant.
    """
    print(f"DEBUG: User {current_user.email} (Role: {current_user.role}, Tenant: {current_user.tenant_id}) attempting to add business {business_in.google_place_id}")
    
    if current_user.role != "OWNER":
        print(f"DEBUG: Access denied. User is {current_user.role}, not OWNER")
        raise HTTPException(status_code=400, detail=f"Only owners can add businesses. Your role: {current_user.role}")

    # Check if business already exists for this tenant
    existing_business = db.query(models.Business).filter(
        models.Business.google_place_id == business_in.google_place_id,
        models.Business.tenant_id == current_user.tenant_id
    ).first()
    
    if existing_business:
        print("DEBUG: Business already exists for this tenant.")
        raise HTTPException(status_code=400, detail="Business already exists in this tenant")
        
    # Fetch details to populate fields
    print(f"DEBUG: Fetching details for {business_in.google_place_id}")
    details = google_maps_service.get_place_details(business_in.google_place_id)
    if not details:
        print("DEBUG: Google Maps details not found.")
        raise HTTPException(status_code=404, detail="Business not found on Google Maps")
        
    # Run initial analysis to get score/ranking
    print("DEBUG: Running analysis...")
    analysis = ranking_engine.analyze_business(details)
    
    try:
        # Create Business instance
        print("DEBUG: Creating Business instance...")
        db_business = models.Business(
            google_place_id=business_in.google_place_id,
            name=details.get("name", business_in.name),
            address=details.get("formatted_address"),
            total_rating=business_in.total_rating,
            review_count=business_in.review_count,
            is_my_business=business_in.is_my_business,
            tenant_id=current_user.tenant_id,
        )
        db.add(db_business)
        db.flush() # Flush to get ID
        
        # Create initial Ranking snapshot
        print("DEBUG: Creating Ranking instance...")
        db_ranking = models.Ranking(
            business_id=db_business.id,
            rank_position=analysis.get("metrics", {}).get("rank_position"), 
            score=analysis.get("score"),
            competitors_json=analysis.get("competitors"), 
            snapshot_date=datetime.utcnow()
        )
        db.add(db_ranking)
        db.commit()
        db.refresh(db_business)
        
        print(f"DEBUG: Business {db_business.id} saved successfully.")
        return db_business
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"CRITICAL: Error saving business: {str(e)}")
        print(error_trace)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Save error: {str(e)}")

@router.get("", response_model=List[schemas.Business])
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
        try:
            if business.rankings:
                # Sort by snapshot_date desc
                latest = sorted(business.rankings, key=lambda x: x.snapshot_date, reverse=True)[0]
                business.latest_ranking = latest
        except Exception as e:
            import logging
            logging.error(f"Error populating ranking for business {business.id}: {str(e)}")
            continue
            
    return businesses
