import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from django.contrib.auth.models import User
from ride.models import UserVehicle, Customer, Driver

email = 'prasannakumarsripadam67@gmail.com'
try:
    user = User.objects.get(username=email)
    print(f"User: {user.username} (ID: {user.id})")
    print(f"Has customer profile: {hasattr(user, 'customer')}")
    print(f"Has driver profile: {hasattr(user, 'driver')}")
    
    vehicles = UserVehicle.objects.filter(user=user)
    print(f"Vehicle count for user: {vehicles.count()}")
    for v in vehicles:
        print(f" - {v.brand} {v.model_name} ({v.registration_number})")

except User.DoesNotExist:
    print(f"User {email} not found in DB.")
except Exception as e:
    print(f"Error: {e}")
