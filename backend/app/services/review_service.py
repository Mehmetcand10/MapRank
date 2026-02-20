from typing import List, Dict, Any
from app.services.google_maps import google_maps_service

class ReviewService:
    def get_reviews(self, place_id: str) -> List[Dict[str, Any]]:
        """
        Fetches reviews from Google Maps and adds sentiment analysis.
        """
        details = google_maps_service.get_place_details(place_id)
        if not details:
            return []
        
        reviews = details.get("reviews", [])
        
        # Enriched reviews with mock sentiment
        processed_reviews = []
        for review in reviews:
            sentiment = self._analyze_sentiment(review.get("text", ""), review.get("rating", 0))
            processed_reviews.append({
                **review,
                "sentiment": sentiment
            })
            
        return processed_reviews

    def _analyze_sentiment(self, text: str, rating: int) -> str:
        """
        Simple sentiment analysis based on rating.
        In a real app, use NLP (NLTK/TextBlob/OpenAI).
        """
        if rating >= 4:
            return "positive"
        elif rating <= 2:
            return "negative"
        else:
            return "neutral"

    def generate_reply_draft(self, review_text: str, rating: int, author_name: str, tone: str = "professional") -> str:
        """
        Generates an AI reply draft based on the review.
        """
        # Mock Templates
        templates = {
            "positive": {
                "professional": f"Sayın {author_name}, değerli geri bildiriminiz için teşekkür ederiz. Memnuniyetiniz bizim için çok önemli. Sizi tekrar ağırlamaktan mutluluk duyarız.",
                "friendly": f"Selam {author_name}! Harika yorumun için çok teşekkürler! 🌟 Seni tekrar görmek için sabırsızlanıyoruz!"
            },
            "negative": {
                "professional": f"Sayın {author_name}, yaşadığınız olumsuz deneyim için üzgünüz. Konuyu detaylı incelemek ve telafi etmek isteriz. Lütfen bizimle iletişime geçin.",
                "apologetic": f"Sevgili {author_name}, beklentilerinizi karşılayamadığımız için çok özür dileriz. 😔 Bu durumu düzeltmek için elimizden geleni yapmak istiyoruz."
            },
            "neutral": {
                "professional": f"Sayın {author_name}, geri bildiriminiz için teşekkürler. Hizmetimizi geliştirmek adına yorumlarınızı dikkate alacağız.",
                "friendly": f"Teşekkürler {author_name}! Daha iyisini yapabilmek için çalışıyoruz. Görüşlerin bizim için değerli."
            }
        }
        
        sentiment = self._analyze_sentiment(review_text, rating)
        
        # Fallback tone mapping if exact tone not found
        if tone not in ["professional", "friendly", "apologetic"]:
            tone = "professional"
            
        # Specific handling for negative + friendly combination (might be weird, use apologetic/professional)
        if sentiment == "negative" and tone == "friendly":
            tone = "apologetic"

        # Get template
        base_reply = templates.get(sentiment, {}).get(tone, templates["neutral"]["professional"])
        
        # Basic personalization if text mentions specific keywords (Mock AI)
        if "lezzetli" in review_text.lower() or "tasty" in review_text.lower():
            base_reply += " Beğenmenize çok sevindik!"
            
        if "pahalı" in review_text.lower() or "expensive" in review_text.lower():
            base_reply += " Fiyat politikamızı kalite standartlarımızla dengeli tutmaya çalışıyoruz."

        return base_reply

review_service = ReviewService()
