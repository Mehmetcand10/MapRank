from celery import shared_task
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app import models
from app.services.ranking_engine import ranking_engine
from app.services.google_maps import google_maps_service
import logging

logger = logging.getLogger(__name__)

@shared_task
def check_competitor_alerts():
    """
    Periodic task to check for ranking changes and new competitors.
    """
    db: Session = SessionLocal()
    try:
        # Get all active businesses
        businesses = db.query(models.Business).all()
        
        for business in businesses:
            logger.info(f"Checking alerts for business: {business.name}")
            
            # 1. Check Ranking Changes
            current_rank = business.latest_ranking.rank_position if business.latest_ranking else None
            
            # Fetch fresh data (using existing analysis logic)
            details = google_maps_service.get_place_details(business.google_place_id)
            if details:
                analysis = ranking_engine.analyze_business(details)
                new_rank = analysis.get("metrics", {}).get("rank_position")
                
                if current_rank and new_rank and new_rank > current_rank:
                     # Rank dropped (lower number is better rank, so higher number is worse)
                     alert_msg = f"📉 ALERT: {business.name} ranking dropped from #{current_rank} to #{new_rank}!"
                     logger.warning(alert_msg)
                     # TODO: Integrate EmailService.send_alert(user.email, alert_msg)
                elif new_rank and new_rank <= 3 and (not current_rank or current_rank > 3):
                     alert_msg = f"🚀 CONGRATS: {business.name} is now in top 3 (Rank #{new_rank})!"
                     logger.info(alert_msg)
                     # TODO: Integrate EmailService.send_alert(user.email, alert_msg)

            # 2. Check Negative Reviews
            # In a real scenario, we would query the database for reviews created_at > last_check_time
            # For now, we simulate checking the latest review
            reviews = details.get('reviews', [])
            if reviews:
                latest_review = reviews[0] # Assuming sorted by time
                if latest_review.get('rating', 5) <= 2:
                     review_alert = f"⚠️ NEW NEGATIVE REVIEW: {latest_review.get('author_name')} gave 1-2 stars!"
                     logger.warning(review_alert)
                     # TODO: Integrate EmailService.send_alert(user.email, review_alert)
            
    except Exception as e:
        logger.error(f"Error in check_competitor_alerts: {e}")
    finally:
        db.close()
