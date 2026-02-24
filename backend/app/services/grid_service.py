from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas
from .grid_engine import grid_engine
from .google_maps import google_maps_service
import logging

class GridService:
    def run_analysis(
        self, 
        db: Session, 
        business: models.Business, 
        keyword: str, 
        radius_km: float = 1.0, 
        grid_size: int = 5
    ) -> models.GridRankSnapshot:
        # 0. Initial validation
        if not business.google_place_id:
            logger.error(f"Business {business.id} has no Google Place ID")
            raise Exception("Business is missing Google Place ID")

        # 1. Get location from business address or use stored lat/lng if available
        # For now, let's get details to find geometry
        logger.info(f"Fetching details for business: {business.name} ({business.google_place_id})")
        details = google_maps_service.get_place_details(business.google_place_id)
        
        if not details or 'geometry' not in details:
            logger.error(f"Could not find coordinates for place_id: {business.google_place_id}")
            raise Exception("Could not find business location for grid analysis. Please verify the business address.")
            
        center_lat = details['geometry']['location']['lat']
        center_lng = details['geometry']['location']['lng']
        
        logger.info(f"Grid analysis started at: {center_lat}, {center_lng} for keyword: '{keyword}'")

        # 2. Create Snapshot record
        snapshot = models.GridRankSnapshot(
            business_id=business.id,
            keyword=keyword,
            radius_km=radius_km,
            grid_size=grid_size,
            center_lat=center_lat,
            center_lng=center_lng
        )
        db.add(snapshot)
        db.flush()
        
        # 3. Generate Grid Points
        grid_points = grid_engine.generate_grid(center_lat, center_lng, radius_km, grid_size)
        logger.info(f"Generated {len(grid_points)} grid points for analysis")

        ranks = []
        for idx, (lat, lng) in enumerate(grid_points):
            # 4. Simulate search at this point
            # We use nearby search with keyword at this specific coordinate
            try:
                nearby = google_maps_service.search_nearby(
                    location={"lat": lat, "lng": lng},
                    keyword=keyword,
                    radius=500 # Small radius for localized rank
                )
                
                # 5. Find business in results
                rank = None
                winner = None
                if nearby:
                    winner = nearby[0]['name']
                    for r_idx, result in enumerate(nearby):
                        if result.get('google_place_id') == business.google_place_id:
                            rank = r_idx + 1
                            break
                
                # 6. Save Point Rank
                point = models.GridPointRank(
                    snapshot_id=snapshot.id,
                    lat=lat,
                    lng=lng,
                    rank=rank,
                    is_competitor_winner=winner if rank != 1 else None,
                    point_metadata={"search_results_count": len(nearby) if nearby else 0}
                )
                db.add(point)
                
                if rank:
                    ranks.append(rank)
                else:
                    ranks.append(21) # Count as out of top 20
                
                if (idx + 1) % 5 == 0:
                    logger.info(f"Progress: {idx + 1}/{len(grid_points)} points processed")
                    
            except Exception as point_err:
                logger.warning(f"Error processing point {idx} ({lat}, {lng}): {str(point_err)}")
                ranks.append(21) # Count as failure/not found
        
        # 7. Calculate Final Scores
        if ranks:
            snapshot.average_rank = sum(ranks) / len(ranks)
            snapshot.visibility_score = grid_engine.calculate_visibility_score(ranks)
        else:
            snapshot.average_rank = 21.0
            snapshot.visibility_score = 0.0
        
        logger.info(f"Analysis complete. Avg Rank: {snapshot.average_rank}, Visibility: {snapshot.visibility_score}")
        
        db.commit()
        db.refresh(snapshot)
        return snapshot

    def get_history(self, db: Session, business_id: str) -> List[models.GridRankSnapshot]:
        return db.query(models.GridRankSnapshot).filter(
            models.GridRankSnapshot.business_id == business_id
        ).order_by(models.GridRankSnapshot.created_at.desc()).all()

grid_service = GridService()
