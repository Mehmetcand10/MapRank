import math
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from app.services.google_maps import google_maps_service

class RankingEngine:
    def calculate_advanced_metrics(self, business_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates granular metrics for advanced scoring.
        Currently using heuristics and mock patterns based on accessible data.
        """
        rating = float(business_data.get("rating") or 0.0)
        review_count = int(business_data.get("user_ratings_total") or 0)
        
        # Heuristic calculations for mock-up
        completeness = 0.0
        if business_data.get("formatted_address"): completeness += 20
        if business_data.get("formatted_phone_number"): completeness += 20
        if business_data.get("website"): completeness += 20
        if business_data.get("photos"): completeness += 20
        if business_data.get("opening_hours"): completeness += 20
        
        response_rate = min(95.0, rating * 20 - (10 if rating < 4 else 0)) 
        response_speed = max(2.5, 48 - (rating * 8))
        velocity = round(review_count * 0.08, 1) if review_count > 0 else 0
        photo_count = len(business_data.get("photos", [])) if business_data.get("photos") else 0
        keyword_score = min(98.0, 60 + (rating * 5))

        return {
            "review_velocity_30d": velocity,
            "owner_response_rate": response_rate,
            "response_speed_hours": response_speed,
            "photo_count": photo_count,
            "profile_completeness_percent": completeness,
            "keyword_relevance_score": keyword_score
        }

    def calculate_score(self, business_data: Dict[str, Any], metrics: Dict[str, Any]) -> float:
        """
        Calculates the advanced MapRank score (0-100).
        """
        rating = business_data.get("rating", 0.0)
        review_count = business_data.get("user_ratings_total", 0)
        
        W_RATING = 0.25
        W_REVIEWS = 0.15
        W_RESPONSE = 0.20
        W_COMPLETENESS = 0.20
        W_VELOCITY = 0.10
        W_RELEVANCE = 0.10
        
        s_rating = (rating / 5.0) * 100
        max_reviews = 5000
        s_reviews = min(math.log(review_count + 1) / math.log(max_reviews), 1.0) * 100
        s_response = metrics["owner_response_rate"]
        s_completeness = metrics["profile_completeness_percent"]
        max_vel = 50 
        s_velocity = min(metrics["review_velocity_30d"] / max_vel, 1.0) * 100
        s_relevance = metrics["keyword_relevance_score"]
        
        final_score = (
            (s_rating * W_RATING) +
            (s_reviews * W_REVIEWS) +
            (s_response * W_RESPONSE) +
            (s_completeness * W_COMPLETENESS) +
            (s_velocity * W_VELOCITY) +
            (s_relevance * W_RELEVANCE)
        )
        
        return round(final_score, 1)

    def analyze_business(self, business_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes a business with advanced ENTERPRISE metrics.
        """
        adv_metrics = self.calculate_advanced_metrics(business_data)
        score = self.calculate_score(business_data, adv_metrics)
        
        rating = business_data.get("rating", 0.0)
        review_count = business_data.get("user_ratings_total", 0)
        
        TARGET_RATING = 4.8
        TARGET_REVIEWS = 100
        recommendations = []
        
        # Logic for recommendations
        if adv_metrics["owner_response_rate"] < 70:
            recommendations.append({
                "type": "critical",
                "message": f"Yanıt oranınız çok düşük (%{adv_metrics['owner_response_rate']}). Müşterilere mutlaka yanıt verin."
            })
            
        if adv_metrics["profile_completeness_percent"] < 100:
            recommendations.append({
                "type": "warning",
                "message": "Profiliniz tam değil. Eksik bilgileri (çalışma saatleri vb.) Google'da tamamlayın."
            })

        # Competitor Analysis
        location = business_data.get("geometry", {}).get("location")
        competitors = []
        rank_position = 0
        total_competitors = 0
        avg_competitor_rating = 0.0
        competitor_keywords = []
        
        if location:
            types = business_data.get("types", [])
            selected_type = next((t for t in types if t not in {"point_of_interest", "establishment", "premise", "geocode"}), None)
            keyword = business_data.get("name", "").split(" ")[-1] if not selected_type else None
            competitors_raw = google_maps_service.search_nearby(location=location, keyword=keyword, type=selected_type)
            
            my_place_id = business_data.get("place_id") or business_data.get("google_place_id")
            my_types = set(business_data.get("types", []))
            
            # BROAD CATEGORIES to prevent industry mixing (e.g. Hotels vs Restaurants)
            SECTORS = {
                "food": {"restaurant", "food", "cafe", "bakery", "meal_takeaway", "meal_delivery", "bar"},
                "lodging": {"lodging", "hotel", "hostel", "motel"},
                "health": {"doctor", "dentist", "hospital", "clinic", "pharmacy"},
                "automotive": {"car_repair", "car_dealer", "gas_station", "car_wash"},
                "beauty": {"beauty_salon", "hair_care", "spa"}
            }
            
            my_sectors = {s for s, tps in SECTORS.items() if my_types.intersection(tps)}
            
            competitors = []
            for c in competitors_raw:
                if c.get("google_place_id") == my_place_id:
                    continue
                
                c_types = set(c.get("types", []))
                
                # Check for sector mismatch
                is_mismatch = False
                for sect, tps in SECTORS.items():
                    # If competitor belongs to a sector that I don't, it's a mismatch
                    if sect not in my_sectors and c_types.intersection(tps):
                        is_mismatch = True
                        break
                
                if not is_mismatch or not my_sectors:
                    competitors.append(c)
            
            if competitors:
                all_b = competitors + [{"name": business_data.get("name"), "rating": rating, "user_ratings_total": review_count, "is_me": True}]
                all_b.sort(key=lambda x: (x.get("rating", 0), x.get("user_ratings_total", 0)), reverse=True)
                
                for i, b in enumerate(all_b):
                    if b.get("is_me"):
                        rank_position = i + 1
                        break
                
                total_competitors = len(competitors)
                avg_competitor_rating = sum(c.get("rating", 0) for c in competitors) / total_competitors
                
                # EXTRACT ACTUAL KEYWORDS FROM GOOGLE REVIEWS (User Request: "vgoogleden tam gelsın")
                raw_reviews = business_data.get("reviews", [])
                extracted_keywords = {}
                common_terms = {"ve", "bir", "bu", "da", "de", "çok", "için", "olan", "the", "and", "is", "was", "for", "with"}
                
                for review in raw_reviews:
                    text = review.get("text", "").lower()
                    words = [w.strip(".,!?") for w in text.split() if len(w) > 3 and w not in common_terms]
                    for w in words:
                        extracted_keywords[w] = extracted_keywords.get(w, 0) + 1
                
                if extracted_keywords:
                    # Sort by count and take top 5
                    sorted_keywords = sorted(extracted_keywords.items(), key=lambda x: x[1], reverse=True)[:5]
                    competitor_keywords = [
                        {"keyword": k, "count": c, "impact": "Önemli" if c > 2 else "Normal"} 
                        for k, c in sorted_keywords
                    ]
                else:
                    # Fallback to sector specific keywords if no reviews
                    competitor_keywords = [
                        {"keyword": "kalite", "count": 1, "impact": "Normal"},
                        {"keyword": "hizmet", "count": 1, "impact": "Normal"}
                    ]
        
        benchmarks = {
            "avg_rating": round(avg_competitor_rating or 4.2, 1),
            "avg_reviews": 45,
            "avg_response_rate": 65.0
        }

        result = {
            "score": score,
            "metrics": {
                "rating": rating,
                "review_count": review_count,
                "sentiment_positive": 75,
                "sentiment_neutral": 15,
                "sentiment_negative": 10,
                "rank_position": rank_position,
                "total_competitors": total_competitors,
                "avg_competitor_rating": round(avg_competitor_rating, 1)
            },
            "targets": {"rating": TARGET_RATING, "review_count": TARGET_REVIEWS},
            "recommendations": recommendations,
            "analysis_text": self._generate_summary(score, recommendations),
            "formatted_address": business_data.get("formatted_address"),
            "formatted_phone_number": business_data.get("formatted_phone_number"),
            "website": business_data.get("website"),
            "validation_status": business_data.get("business_status", "Unknown"),
            "photo_url": business_data.get("photos", [{}])[0].get("photo_reference") if business_data.get("photos") else business_data.get("icon"),
            "business_types": business_data.get("types", []),
            "competitors": competitors[:5],
            "is_tracked": False,
            
            # Advanced Metrics
            "review_velocity_30d": adv_metrics["review_velocity_30d"],
            "owner_response_rate": adv_metrics["owner_response_rate"],
            "response_speed_hours": adv_metrics["response_speed_hours"],
            "photo_count": adv_metrics["photo_count"],
            "profile_completeness_percent": adv_metrics["profile_completeness_percent"],
            "keyword_relevance_score": adv_metrics["keyword_relevance_score"],
            "competitor_keywords": competitor_keywords,
            
            # Premium
            "visibility_score": round(score * 1.05, 1) if score < 95 else score,
            "market_share_estimate": round(35 / (rank_position or 1), 1) if rank_position else 5.0,
            "sentiment_trends": [
                {"month": "Oca", "score": max(40, score - 15)},
                {"month": "Şub", "score": max(50, score - 8)},
                {"month": "Mar", "score": score}
            ],
            "growth_hacks": self._generate_growth_hacks(business_data, recommendations),
            "sector_benchmarks": benchmarks
        }

        return result

    def _generate_growth_hacks(self, data: dict, recs: list) -> list:
        hacks = [
            "Google İşletme profilinize haftalık en az 3 fotoğraf ekleyin (Etkileşimi %35 artırır).",
            "Müşteri yorumlarına ilk 24 saat içinde yanıt verin; algoritma hızı sever.",
            "En popüler ürününüzü işletme açıklamasında stratejik olarak geçirin.",
            "Bölgenizdeki rakiplerin yoğun olduğu saatlerde 'Google Post' paylaşarak öne çıkın."
        ]
        return hacks[:4]

    def _generate_summary(self, score: float, recommendations: list) -> str:
        if score >= 85: return "Harika iş! İşletmeniz bölgenin en iyileri arasında."
        if score >= 60: return "İyi bir yoldasınız ancak zirve için atmanız gereken adımlar var."
        return "İşletmenizin dijital varlığı zayıf görünüyor. Acil müdahale gerekli."

ranking_engine = RankingEngine()
