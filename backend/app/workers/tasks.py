from app.workers.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.tenant import Tenant
from app.models.business import Business
from app.services.google_maps import google_maps_service
from app.services.ranking_engine import ranking_engine
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

@celery_app.task
def refresh_rankings(tenant_id: str):
    db: Session = SessionLocal()
    try:
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            logger.error(f"Tenant {tenant_id} not found")
            return

        logger.info(f"Refreshing rankings for tenant {tenant.name} ({tenant_id})")
        
        businesses = db.query(Business).filter(Business.tenant_id == tenant_id).all()
        for business in businesses:
            try:
                # fetch fresh details
                details = google_maps_service.get_place_details(business.google_place_id)
                if details:
                    # analyze and update score
                    analysis = ranking_engine.analyze_business(details)
                    # Here we would update the business model with new stats
                    # For now just log
                    logger.info(f"Updated {business.name}: Score {analysis['score']}")
            except Exception as e:
                 logger.error(f"Error updating business {business.id}: {e}")

    finally:
        db.close()

@celery_app.task
def scheduled_refresh():
    """
    Periodic task to check which tenants need refresh.
    """
    db: Session = SessionLocal()
    try:
        # Simple logic: refresh everyone. In real app, check 'next_run' time.
        tenants = db.query(Tenant).all()
        for tenant in tenants:
            refresh_rankings.delay(str(tenant.id))
    finally:
        db.close()
