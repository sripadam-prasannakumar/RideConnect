import os
import django
import sys

# Setup django
sys.path.append(r'c:\Users\Lenovo\Desktop\Ride Connect\backend_project\rideconnect_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from ride.models import Driver, Ride, Customer
from django.contrib.auth.models import User
from decimal import Decimal

def test_driver_filtering():
    print("--- Testing Driver Filtering ---")
    # Pickup location (hypothetical)
    p_lat, p_lng = 17.3850, 78.4867 # Hyderabad
    
    # Create/Update a driver within 20km
    u_near, _ = User.objects.get_or_create(username='driver@test.com', defaults={'email': 'driver@test.com'})
    driver_near, _ = Driver.objects.get_or_create(user=u_near)
    driver_near.is_online = True
    driver_near.verification_status = 'verified'
    driver_near.vehicle_type = 'car'
    driver_near.current_lat = 17.3890
    driver_near.current_lng = 78.4900
    driver_near.save()
    print(f"Driver Near: {driver_near.user.username} set at {driver_near.current_lat}, {driver_near.current_lng}")

    # Create/Update a driver outside 20km
    u_far, _ = User.objects.get_or_create(username='far@test.com', defaults={'email': 'far@test.com'})
    driver_far, _ = Driver.objects.get_or_create(user=u_far)
    driver_far.is_online = True
    driver_far.verification_status = 'verified'
    driver_far.vehicle_type = 'car'
    driver_far.current_lat = 18.0000 # ~70km away
    driver_far.current_lng = 79.0000
    driver_far.save()
    print(f"Driver Far: {driver_far.user.username} set at {driver_far.current_lat}, {driver_far.current_lng}")

    # The actual testing would normally happen via a request to RideRequestView
    # But we can verify the haversine logic here
    from ride.views import haversine_distance
    
    dist_near = haversine_distance(p_lat, p_lng, driver_near.current_lat, driver_near.current_lng)
    dist_far = haversine_distance(p_lat, p_lng, driver_far.current_lat, driver_far.current_lng)
    
    print(f"Dist Near: {dist_near:.2f} km (Should be < 20)")
    print(f"Dist Far: {dist_far:.2f} km (Should be > 20)")
    
    if dist_near <= 20 and dist_far > 20:
        print("SUCCESS: Radius filtering logic verified.")
    else:
        print("FAILURE: Radius filtering logic failed.")

if __name__ == "__main__":
    test_driver_filtering()
