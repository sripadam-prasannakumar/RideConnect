import os
import django
import json
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from ride.models import Customer, UserVehicle
from ride.serializers import RideSerializer

def test_serializer():
    customer = Customer.objects.first()
    vehicle = UserVehicle.objects.first()
    
    if not customer:
        print("No customer found in DB")
        return

    data = {
        'customer_id': customer.id,
        'email': customer.user.username,
        'pickup_location': 'Kakinada, Andhra Pradesh',
        'drop_location': 'Goa, India',
        'pickup_lat': 16.9891,
        'pickup_lng': 82.2475,
        'drop_lat': 15.2993,
        'drop_lng': 74.1240,
        'duration_text': '13h 58m',
        'duration_seconds': 50300,
        'price': 4181,
        'selected_vehicle_type': 'car',
        'vehicle_id': vehicle.id if vehicle else None,
        'status': 'pending'
    }
    
    serializer = RideSerializer(data=data)
    if serializer.is_valid():
        print("Serializer is VALID")
    else:
        print("Serializer ERRORS:")
        print(json.dumps(serializer.errors, indent=2))

if __name__ == "__main__":
    test_serializer()
