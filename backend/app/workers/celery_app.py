from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

# Create Celery app
celery_app = Celery(
    "dao_portal_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    worker_hijack_root_logger=False,
    task_track_started=True,
    task_time_limit=60 * 60,  # 1 hour
    task_soft_time_limit=60 * 30,  # 30 minutes
    worker_prefetch_multiplier=1,
)

# Configure periodic tasks (cron jobs)
celery_app.conf.beat_schedule = {
    "fetch-all-metrics-daily": {
        "task": "app.workers.tasks.fetch_metrics_for_all_daos",
        "schedule": crontab(hour=2, minute=0),  # Run at 2:00 AM every day
    },
}