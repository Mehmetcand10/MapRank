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
        # 1. Get location from business address or use stored lat/lng if available
        # For now, let's get details to find geometry
        details = google_maps_service.get_place_details(business.google_place_id)
        if not details or not details.get('geometry'):
            raise Exception("Could not find business location for grid analysis")
            
        center_lat = details['geometry']['location']['lat']
        center_lng = details['geometry']['location']['lng']
        
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
        
        ranks = []
        for lat, lng in grid_points:
            # 4. Simulate search at this point
            # We use nearby search with keyword at this specific coordinate
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
                for idx, result in enumerate(nearby):
                    if result['google_place_id'] == business.google_place_id:
                        rank = idx + 1
                        break
            
            # 6. Save Point Rank
            point = models.GridPointRank(
                snapshot_id=snapshot.id,
                lat=lat,
                lng=lng,
                rank=rank,
                is_competitor_winner=winner if rank != 1 else None
            )
            db.add(point)
            if rank:
                ranks.append(rank)
            else:
                ranks.append(21) # Count as out of top 20
        
        # 7. Calculate Final Scores
        snapshot.average_rank = sum(ranks) / len(ranks) if ranks else None
        snapshot.visibility_score = grid_engine.calculate_visibility_score(ranks)
        
        db.commit()
        db.refresh(snapshot)
        return snapshot

    def get_history(self, db: Session, business_id: str) -> List[models.GridRankSnapshot]:
        return db.query(models.GridRankSnapshot).filter(
            models.GridRankSnapshot.business_id == business_id
        ).order_by(models.GridRankSnapshot.created_at.desc()).all()

grid_service = GridService()
