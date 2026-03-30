import logging
from django.conf import settings
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from django.core.management.base import BaseCommand
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
from django_apscheduler import util

from django.utils import timezone
from datetime import timedelta
from ride.models import Ride
from ride.serializers import RidePublicSerializer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)

def check_scheduled_rides():
    now = timezone.now()
    # Find rides scheduled to start within the next 10 minutes that are still 'scheduled'
    trigger_time = now + timedelta(minutes=10)
    scheduled_rides = Ride.objects.filter(status='scheduled', scheduled_time__lte=trigger_time)
    
    if scheduled_rides.exists():
        channel_layer = get_channel_layer()
        for ride in scheduled_rides:
            ride.status = 'searching'
            ride.save(update_fields=['status', 'updated_at'])
            
            # Broadcast to online drivers
            driver_group_name = f"drivers_{ride.vehicle_type}"
            async_to_sync(channel_layer.group_send)(
                driver_group_name,
                {
                    "type": "new_ride_notification",
                    "ride_data": RidePublicSerializer(ride).data
                }
            )
            print(f"Triggered scheduled ride {ride.id} for {ride.vehicle_type} drivers at {now}")

@util.close_old_connections
def delete_old_job_executions(max_age=604_800):
    DjangoJobExecution.objects.delete_old_job_executions(max_age)

class Command(BaseCommand):
    help = "Runs APScheduler."

    def handle(self, *args, **options):
        scheduler = BlockingScheduler(timezone=settings.TIME_ZONE)
        scheduler.add_jobstore(DjangoJobStore(), "default")

        scheduler.add_job(
            check_scheduled_rides,
            trigger=CronTrigger(minute="*/1"),  # Every 1 minute
            id="check_scheduled_rides",
            max_instances=1,
            replace_existing=True,
        )
        logger.info("Added job 'check_scheduled_rides'.")

        scheduler.add_job(
            delete_old_job_executions,
            trigger=CronTrigger(day_of_week="mon", hour="00", minute="00"),
            id="delete_old_job_executions",
            max_instances=1,
            replace_existing=True,
        )
        logger.info("Added job 'delete_old_job_executions'.")

        try:
            logger.info("Starting scheduler...")
            scheduler.start()
        except KeyboardInterrupt:
            logger.info("Stopping scheduler...")
            scheduler.shutdown()
            logger.info("Scheduler shut down successfully!")
