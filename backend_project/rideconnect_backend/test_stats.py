import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from ride.models import Driver, Customer, Ride
from django.contrib.auth.models import User
from django.db.models import Sum

try:
    total_users = User.objects.count()
    total_customers = Customer.objects.count()
    total_drivers = Driver.objects.count()
    active_drivers = Driver.objects.filter(is_online=True).count()
    ongoing_rides = Ride.objects.filter(status='ongoing').count()
    completed_rides = Ride.objects.filter(status='completed').count()
    
    # Calculate total platform commission earned and pending
    all_drivers = Driver.objects.all()
    total_earned = all_drivers.aggregate(Sum('total_commission_paid'))['total_commission_paid__sum'] or 0
    total_pending = all_drivers.aggregate(Sum('total_commission_pending'))['total_commission_pending__sum'] or 0

    print({
        "total_users": total_customers,
        "total_drivers": total_drivers,
        "active_drivers": active_drivers,
        "ongoing_rides": ongoing_rides,
        "completed_rides": completed_rides,
        "total_commission_earned": float(total_earned),
        "total_commission_pending": float(total_pending),
        "platform_revenue": float(total_earned),
        "platform_commission": float(total_earned)
    })
except Exception as e:
    import traceback
    traceback.print_exc()
