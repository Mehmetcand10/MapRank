from celery import Celery
from app.core.config import settings

celery_app = Celery("worker", broker=settings.REDIS_URL, backend=settings.REDIS_URL)

celery_app.conf.task_routes = {"app.workers.tasks.*": "main-queue"}

celery_app.conf.beat_schedule = {
    "refresh-rankings-every-hour": {
        "task": "app.workers.tasks.scheduled_refresh",
        "schedule": 3600.0, # 1 hour
    },
    "check-alerts-every-30-mins": {
        "task": "app.workers.alerts.check_competitor_alerts",
        "schedule": 1800.0, # 30 mins
    },
}
