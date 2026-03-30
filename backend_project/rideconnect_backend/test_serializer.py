import os
import sys
sys.path.append(r"c:\Users\Lenovo\Desktop\Ride Connect\backend_project\rideconnect_backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rideconnect_backend.settings")
import django
django.setup()

from ride.serializers import UserVehicleSerializer

data = {
    'vehicle_type': 'car',
    'brand': 'Toyota',
    'model_name': 'Fortuner',
    'registration_number': 'AP08TH1441',
    'fuel_type': 'diesel',
    'transmission': 'automatic',
}

s = UserVehicleSerializer(data=data)
print("Valid:", s.is_valid())
print("Errors:", s.errors)
