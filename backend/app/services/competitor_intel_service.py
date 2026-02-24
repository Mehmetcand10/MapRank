import logging
import random
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app import models, schemas
from app.services.ranking_engine import ranking_engine

logger = logging.getLogger(__name__)

class CompetitorIntelligenceService:
    def analyze_strategy(self, business: models.Business, competitors: List[models.Competitor]) -> Dict[str, Any]:
        """
        AI-driven analysis of why competitors are ranking higher.
        """
        if not competitors:
            return {"insight": "Henüz rakip verisi yok.", "comparison": []}
            
        # Comparison logic
        comparison = []
        for comp in competitors[:3]: # Take top 3
            # Check gap
            rating_gap = (comp.rating or 0) - (business.total_rating or 0)
            review_gap = (comp.review_count or 0) - (business.review_count or 0)
            
            reasons = []
            if rating_gap > 0.2: reasons.append("Daha yüksek müşteri puanı")
            if review_gap > 50: reasons.append("Daha fazla yorum hacmi")
            if comp.photo_count > 50: reasons.append("Zengin görsel içerik (Fotoğraf)")
            
            comparison.append({
                "competitor_name": comp.name,
                "advantage": ", ".join(reasons) if reasons else "Yakın rekabet",
                "risk_level": "High" if review_gap > 200 else "Medium",
                "ai_winning_strategy": f"Bu rakibi geçmek için {reasons[0] if reasons else 'yorum hızı'} odağına yoğunlaşın."
            })
            
        return {
            "overall_insight": "Rakipleriniz genel olarak 'Görsel Güncellik' ve 'Hızlı Yorum Yanıtı' ile öne çıkıyor.",
            "competitor_strategies": comparison,
            "action_plan": [
                "Rakiplerinizin son 30 günlük yorum artış hızını (velocity) yakalayın.",
                "Profilinize haftalık 5 adet anahtar kelime odaklı fotoğraf ekleyin.",
                "En güçlü rakibinizin (fiyat/performans) zayıf olduğu 'ilgisizlik' yorumlarını kendi profilinizde 'ilgi' olarak öne çıkarın."
            ]
        }

    def get_benchmarks(self, category: str, location: str) -> Dict[str, Any]:
        """
        Calculates industry/city averages.
        """
        # Mocking sector data
        sectors = {
            "restaurant": {"rating": 4.2, "reviews": 150, "velocity": 8.5},
            "furniture_store": {"rating": 4.5, "reviews": 85, "velocity": 3.2},
            "health": {"rating": 4.7, "reviews": 210, "velocity": 12.0}
        }
        
        data = sectors.get(category.lower(), {"rating": 4.3, "reviews": 100, "velocity": 5.0})
        
        return {
            "category": category,
            "location": location,
            "averages": data,
            "market_competition": "High" if data["velocity"] > 10 else "Medium",
            "benchmark_text": f"{location} bölgesindeki {category} sektörü için ortalama puan {data['rating']}, aylık yorum hızı ise {data['velocity']}."
        }

competitor_intelligence_service = CompetitorIntelligenceService()
