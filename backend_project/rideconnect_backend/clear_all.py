import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from ride.models import RideRequest

print("Active Rides before wipe:")
for r in RideRequest.objects.all():
    print(r.id, r.status, r.pickup_location, r.destination)

count, _ = RideRequest.objects.all().delete()
print(f'WIPED OUT {count} RIDES FROM DB TO FIX THE AUTO POPUP BUG.')
