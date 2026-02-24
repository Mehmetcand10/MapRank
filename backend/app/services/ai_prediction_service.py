import logging
import random
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app import models, schemas
from app.services.ranking_engine import ranking_engine

logger = logging.getLogger(__name__)

class AIPredictionService:
    def predict_impact(self, db: Session, business: models.Business, keyword: str, scenario: Dict[str, Any]) -> models.AIPrediction:
        """
        Predicts the impact of specific actions (e.g. more reviews) on GMB ranking.
        """
        logger.info(f"Predicting AI impact for {business.name} on keyword: {keyword}")
        
        # 1. Get current baseline
        # In a real app, we'd fetch the latest ranking snapshot
        current_rank = 15.0 # Mock baseline
        current_score = business.health_score or 50.0
        
        # 2. Simulation Logic
        # Weights for impact
        added_reviews = scenario.get("added_reviews", 0)
        added_photos = scenario.get("added_photos", 0)
        stars = scenario.get("stars", 5.0)
        faster_response = scenario.get("faster_response", False)
        
        # Calculate score boost
        boost = 0.0
        boost += (added_reviews * 0.5) * (stars / 5.0)
        boost += (added_photos * 0.2)
        if faster_response: boost += 5.0
        
        # Cap boost
        boost = min(boost, 30.0)
        
        # Predict rank gain (Inverse proportional to boost)
        # Higher boost -> Lower (better) rank
        gain = boost / 10.0
        prob = min(95.0, 60.0 + boost)
        
        new_est_position = max(1, current_rank - gain)
        
        results = {
            "prob_increase": round(prob, 1),
            "estimated_rank_gain": round(gain, 1),
            "new_est_position": round(new_est_position, 1),
            "confidence_level": "High" if added_reviews > 20 else "Medium",
            "impact_summary": f"{added_reviews} yeni yorum ve {added_photos} fotoğraf artışı ile sıralamanızda tahmini {round(gain, 1)} basamak yükseliş öngörülüyor."
        }
        
        # 3. Save to DB
        prediction = models.AIPrediction(
            business_id=business.id,
            keyword=keyword,
            scenario_data=scenario,
            prediction_results=results
        )
        db.add(prediction)
        db.commit()
        db.refresh(prediction)
        return prediction

class SentimentIntelligenceService:
    def extract_intelligence(self, reviews: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        NLP Simulation to extract keywords and sentiment from reviews.
        """
        if not reviews:
            return {"sentiment": "Neutral", "keywords": [], "top_issues": [], "top_praises": []}
            
        # Mock logic based on keywords in reviews
        praise_words = ["temiz", "hızlı", "kaliteli", "güleryüzlü", "uygun", "lezzetli"]
        issue_words = ["pahalı", "yavaş", "kötü", "pis", "bekledim", "ilgisiz"]
        
        praises = []
        issues = []
        
        for r in reviews:
            text = r.get("text", "").lower()
            for w in praise_words:
                if w in text: praises.append(w)
            for w in issue_words:
                if w in text: issues.append(w)
                
        # Calculate sentiment score
        p_count = len(praises)
        i_count = len(issues)
        total = p_count + i_count
        
        score = (p_count / total * 100) if total > 0 else 50.0
        
        return {
            "overall_sentiment": "Positive" if score > 70 else "Negative" if score < 40 else "Neutral",
            "sentiment_score": round(score, 1),
            "top_praises": list(set(praises))[:5],
            "top_issues": list(set(issues))[:5],
            "keyword_cloud": praises + issues,
            "ai_insight": "Müşterileriniz en çok 'hız' konusundan şikayetçi. Yanıt sürelerinizi kısaltarak puanınızı artırabilirsiniz." if i_count > p_count else "Hizmet kalitenizden genel bir memnuniyet var. Bu ivmeyi korumak için yorumları teşvik etmeye devam edin."
        }

ai_prediction_service = AIPredictionService()
sentiment_service = SentimentIntelligenceService()
