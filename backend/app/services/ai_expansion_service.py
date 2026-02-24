import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app import models, schemas
from app.services.google_maps import google_maps_service
from app.services.ranking_engine import ranking_engine
from datetime import datetime

logger = logging.getLogger(__name__)

class SEOAuditService:
    def run_audit(self, db: Session, business: models.Business) -> models.SEOAudit:
        """
        Runs a comprehensive Local SEO audit for a business.
        """
        logger.info(f"Running SEO Audit for business: {business.name}")
        
        # 1. Fetch full data from Google
        details = google_maps_service.get_place_details(business.google_place_id)
        if not details:
            raise Exception("Could not fetch business details for audit")
            
        # 2. Use RankingEngine's vitals logic + extended checks
        vitals = ranking_engine.calculate_profile_vitals(details)
        
        # 3. Extended AI-like heuristics for Audit Data
        audit_data = {
            "profile_completeness": {
                "score": vitals["completeness"],
                "status": "Excellent" if vitals["completeness"] > 90 else "Good" if vitals["completeness"] > 70 else "Needs Work",
                "impact": "Critical",
                "suggestion": "Eksik profil bilgilerini (saatler, web sitesi vb.) tamamlayın." if vitals["completeness"] < 100 else "Profiliniz tam!"
            },
            "category_optimization": {
                "score": 85 if len(details.get("types", [])) > 1 else 60,
                "status": "Optimized" if len(details.get("types", [])) > 1 else "Generic",
                "impact": "High",
                "suggestion": "İkincil kategorileri ekleyerek daha fazla aramada görünün."
            },
            "photo_presence": {
                "score": min(100, (len(details.get("photos", [])) / 10) * 100),
                "status": "Rich" if len(details.get("photos", [])) > 10 else "Poor",
                "impact": "Medium",
                "suggestion": "Düzenli olarak haftada 2-3 yeni fotoğraf yükleyin."
            },
            "review_health": {
                "score": min(100, (details.get("rating", 0) / 5) * 100),
                "status": "Strong" if details.get("rating", 0) > 4.5 else "Average",
                "impact": "Critical",
                "suggestion": "Olumsuz yorumlara profesyonelce yanıt vererek çözüm sunun."
            }
        }
        
        # 4. Generate AI Recommendations (Simulation)
        ai_recommendations = [
            {
                "priority": "High",
                "category": "Google Business Profile",
                "title": "Açıklama Metni Optimizasyonu",
                "description": "Açıklamanızda 'en iyi', 'uygun fiyatlı' gibi sektörel anahtar kelimeleri daha stratejik kullanın.",
                "est_impact": "+%15 Görünürlük"
            },
            {
                "priority": "Medium",
                "category": "Visuals",
                "title": "360 Derece Tur",
                "description": "İşletmenizin içine sanal tur eklemek Google algoritmasında güven puanını artırır.",
                "est_impact": "+%10 Dönüşüm"
            }
        ]
        
        # 5. Save to DB
        audit = models.SEOAudit(
            business_id=business.id,
            overall_score=vitals["health_score"],
            audit_data=audit_data,
            ai_recommendations=ai_recommendations
        )
        
        # Update business cache
        business.health_score = vitals["health_score"]
        business.profile_completeness = vitals["completeness"]
        business.last_audit_date = datetime.utcnow()
        
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit

class CompetitorService:
    def discover_and_track_competitors(self, db: Session, business: models.Business) -> List[models.Competitor]:
        """
        Automatically finds the closest and strongest competitors.
        """
        logger.info(f"Auto-discovering competitors for: {business.name}")
        
        # 1. Get business location
        details = google_maps_service.get_place_details(business.google_place_id)
        location = details.get("geometry", {}).get("location")
        
        if not location:
            logger.warning(f"No location found for business {business.id}")
            return []
            
        # 2. Search nearby
        types = details.get("types", [])
        primary_type = next((t for t in types if t not in {"point_of_interest", "establishment", "premise"}), None)
        
        raw_competitors = google_maps_service.search_nearby(
            location=location,
            type=primary_type,
            radius=3000 # 3km radius
        )
        
        added_competitors = []
        for comp_data in raw_competitors:
            # Skip self
            if comp_data["google_place_id"] == business.google_place_id:
                continue
                
            # Check if already exists for this business
            existing = db.query(models.Competitor).filter(
                models.Competitor.business_id == business.id,
                models.Competitor.google_place_id == comp_data["google_place_id"]
            ).first()
            
            if not existing:
                # Heuristic Analysis for Discovery Type
                # In a real app, we would fetch full details for each, but let's be efficient
                competitor = models.Competitor(
                    business_id=business.id,
                    google_place_id=comp_data["google_place_id"],
                    name=comp_data["name"],
                    address=comp_data.get("address"),
                    rating=comp_data.get("rating"),
                    review_count=comp_data.get("user_ratings_total", 0),
                    discovery_type="auto",
                    is_tracked=True,
                    visibility_score=ranking_engine.calculate_score(comp_data, {"owner_response_rate": 70, "review_velocity_30d": 5, "photo_count": 10, "profile_completeness_percent": 80, "keyword_relevance_score": 75}) # Baseline score
                )
                db.add(competitor)
                added_competitors.append(competitor)
                
        db.commit()
        logger.info(f"Auto-tracked {len(added_competitors)} new competitors for {business.name}")
        return added_competitors

seo_audit_service = SEOAuditService()
competitor_service = CompetitorService()
