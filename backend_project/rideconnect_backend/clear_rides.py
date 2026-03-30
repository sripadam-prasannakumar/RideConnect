import os
import sys
import django

# Add the project backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from ride.models import RideRequest

count, _ = RideRequest.objects.filter(status='searching').delete()
print(f'Cleared {count} unaccepted phantom test rides')
