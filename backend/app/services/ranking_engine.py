import math
from typing import Dict, Any

from app.services.google_maps import google_maps_service

class RankingEngine:
    def calculate_score(self, business_data: Dict[str, Any]) -> float:
        """
        Calculates the MapRank score (0-100) based on various factors.
        """
        rating = business_data.get("rating", 0.0)
        review_count = business_data.get("user_ratings_total", 0)
        # In a real scenario, we would also check photo count, completeness, etc.
        
        # Weights
        W_RATING = 0.4
        W_REVIEWS = 0.3
        
        # Normalize Rating (0-5 -> 0-1)
        score_rating = rating / 5.0
        
        # Normalize Reviews (Logarithmic scale to diminish returns after 1000 reviews)
        # log(1) = 0, log(10) = 1, log(100) = 2, log(1000) = 3...
        # We cap at 5000 reviews for max score
        max_reviews = 5000
        score_reviews = min(math.log(review_count + 1) / math.log(max_reviews), 1.0)
        
        # Base Score Calculation
        final_score = (score_rating * W_RATING) + (score_reviews * W_REVIEWS)
        
        # Scale to 0-100
        # The remaining 30% weight would come from other factors not yet implemented
        # So we normalize the current sum to be out of 0.7
        normalized_score = (final_score / (W_RATING + W_REVIEWS)) * 100
        
        return round(normalized_score, 1)

    def analyze_business(self, business_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes a business to generate scores, gap analysis, and recommendations.
        """
        score = self.calculate_score(business_data)
        rating = business_data.get("rating", 0.0)
        review_count = business_data.get("user_ratings_total", 0)
        
        # Define Targets (Ideal benchmarks for a "Top Rank" business)
        TARGET_RATING = 4.8
        TARGET_REVIEWS = 100 # This should be dynamic based on neighbors in real app
        
        recommendations = []
        
        # 1. Rating Analysis
        if rating < 4.0:
            recommendations.append({
                "type": "critical",
                "message": "Puanınız kritik seviyede düşük (4.0 altı). Acilen mutsuz müşterilerle ilgilenmelisiniz."
            })
        elif rating < TARGET_RATING:
            gap = round(TARGET_RATING - rating, 1)
            recommendations.append({
                "type": "warning",
                "message": f"Liderler ligine girmek için ortalamanızı {gap} puan artırmalısınız."
            })
            
        # 2. Review Count Analysis
        if review_count < 10:
            recommendations.append({
                "type": "critical",
                "message": "Yorum sayınız çok az. Güven oluşturmak için en az 10 yoruma ulaşın."
            })
        elif review_count < TARGET_REVIEWS:
            needed = TARGET_REVIEWS - review_count
            recommendations.append({
                "type": "suggestion",
                "message": f"Sıralamada yükselmek için yaklaşık {needed} yeni yoruma ihtiyacınız var."
            })
            
        # 3. Photo Analysis (Mock data for now as API places detail didn't fetch it explicitly in search)
        # In full detail fetch, we check 'photos' list length
        
        # 4. Competitor Analysis (Real Data)
        location = business_data.get("geometry", {}).get("location")
        competitors = []
        rank_position = 0
        total_competitors = 0
        avg_competitor_rating = 0.0
        
        if location:
            # Search for competitors (using name as keyword for category approximation or just "restaurant" as fallback)
            # ideally we use the business "type" from details, but for now we use name or a generic term if not available
            # We can try to use the first type if available from the details if we had it, but business_data usually has 'types'
            # Search for competitors based on business type
            # We prefer 'types' which are more accurate than name-based keywords
            types = business_data.get("types", [])
            selected_type = None
            
            # Common generic types to ignore
            generic_types = {"point_of_interest", "establishment", "premise", "geocode"}
            
            # Find the most specific type
            for t in types:
                if t not in generic_types:
                    selected_type = t
                    break
            
            # Fallback to keyword if no specific type is found
            keyword = None
            if not selected_type:
                keyword = business_data.get("name", "").split(" ")[-1]
            
            # Fetch competitors
            competitors_raw = google_maps_service.search_nearby(
                location=location, 
                keyword=keyword,
                type=selected_type
            )
            
            # Filter out the business itself and ensure valid data
            my_place_id = business_data.get("place_id")
            competitors = []
            for c in competitors_raw:
                # Basic validation: Must have a name and not be me
                if c.get("google_place_id") != my_place_id and c.get("name"):
                    competitors.append(c)
            
            if competitors:
                # specific logic to calculate rank
                all_businesses = competitors + [{
                    "name": business_data.get("name"), 
                    "rating": rating, 
                    "user_ratings_total": review_count,
                    "is_me": True
                }]
                
                # Sort by rating (desc), then review count (desc)
                all_businesses.sort(key=lambda x: (x.get("rating", 0), x.get("user_ratings_total", 0)), reverse=True)
                
                # Find my position
                for i, b in enumerate(all_businesses):
                    if b.get("is_me"):
                        rank_position = i + 1
                        break
                
                total_competitors = len(competitors)
                avg_competitor_rating = sum(c.get("rating", 0) for c in competitors) / total_competitors
                
                # Add competitor insight
                if rank_position > 3:
                     recommendations.append({
                        "type": "warning",
                        "message": f"Bölgenizdeki {total_competitors} rakip arasında {rank_position}. sıradasınız. İlk 3'e girmek için puanınızı artırın."
                    })
                else:
                     recommendations.append({
                        "type": "suggestion",
                        "message": f"Tebrikler! Bölgenizdeki {total_competitors} rakip arasında {rank_position}. sıradasınız."
                    })

        return {
            "score": score,
            "metrics": {
                "rating": rating,
                "review_count": review_count,
                "sentiment_positive": 75, # Mock: 75% positive
                "sentiment_neutral": 15,  # Mock: 15% neutral
                "sentiment_negative": 10,  # Mock: 10% negative
                "rank_position": rank_position,
                "total_competitors": total_competitors,
                "avg_competitor_rating": round(avg_competitor_rating, 1)
            },
            "targets": {
                "rating": TARGET_RATING,
                "review_count": TARGET_REVIEWS
            },
            "recommendations": recommendations,
            "analysis_text": self._generate_summary(score, recommendations),
            "formatted_address": business_data.get("formatted_address"),
            "formatted_phone_number": business_data.get("formatted_phone_number"),
            "website": business_data.get("website"),
            "validation_status": business_data.get("business_status", "Unknown"),
            # Mock photo URL or extract from photos list if available
            "photo_url": business_data.get("photos", [{}])[0].get("photo_reference") if business_data.get("photos") else None,
            "business_types": business_data.get("types", []),
            "competitors": competitors[:5] # Top 5 competitors
        }

    def _generate_summary(self, score: float, recommendations: list) -> str:
        if score >= 85:
            return "Harika iş! İşletmeniz bölgenin en iyileri arasında. Liderliğinizi korumak için etkileşimi sürdürün."
        elif score >= 60:
            return "İyi bir yoldasınız ancak zirve için atmanız gereken adımlar var. Özellikle yorum sayısına odaklanın."
        else:
            return "İşletmenizin dijital varlığı zayıf görünüyor. Potansiyel müşterileri kaçırıyor olabilirsiniz."

ranking_engine = RankingEngine()
