import os
import sys

sys.path.append(r"c:\Users\Lenovo\Desktop\Ride Connect\backend_project\rideconnect_backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rideconnect_backend.settings")
import django
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from ride.views import RideRequestView, UserVehicleListView
from django.contrib.auth.models import User
from ride.models import Customer
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile

def run_tests():
    factory = APIRequestFactory()
    
    # Get a dummy user to test with, preferably a Customer
    customer = Customer.objects.first()
    if not customer:
        print("No customer found in the database.")
        return
        
    user = customer.user
    print(f"Testing with user: {user.email}")

    # --- Test 1: RideRequestView ---
    print("\n--- Testing RideRequestView ---")
    data = {
        'pickup_location': 'Test Pickup',
        'destination': 'Test Drop',
        'pickup_lat': 12.9716,
        'pickup_lng': 77.5946,
        'drop_lat': 12.9816,
        'drop_lng': 77.6046,
        'duration_text': '10 mins',
        'duration_seconds': 600,
        'distance': 10,
        'is_pickup_drop': False,
        'price': 500,
        'selected_vehicle_type': 'car',
        'vehicle_id': 1
    }
    
    request = factory.post('/api/ride/request/', data=data, format='json')
    force_authenticate(request, user=user)
    try:
        response = RideRequestView.as_view()(request)
        print("RideRequestView Status:", response.status_code)
        print("RideRequestView Data:", response.data)
    except Exception as e:
        import traceback
        traceback.print_exc()

    # --- Test 2: UserVehicleListView ---
    print("\n--- Testing Add Vehicle ---")
    file_data = b'fake image data'
    dummy_image = SimpleUploadedFile("front.jpg", file_data, content_type="image/jpeg")
    dummy_image2 = SimpleUploadedFile("back.jpg", file_data, content_type="image/jpeg")
    
    post_data = {
        'email': user.email,
        'vehicle_type': 'car',
        'brand': 'Toyota',
        'model_name': 'Fortuner',
        'registration_number': 'AP08AB1234',
        'fuel_type': 'diesel',
        'transmission': 'automatic',
    }
    
    request_veh = factory.post('/api/user-vehicles/', data=post_data, format='multipart')
    force_authenticate(request_veh, user=user)
    
    # Need to manually add files because factory.post multipart handling in DRF is strict
    # Let's just pass the data dict directly
    post_data['images'] = [dummy_image, dummy_image2]
    request_veh = factory.post('/api/user-vehicles/', data=post_data, format='multipart')
    force_authenticate(request_veh, user=user)
    
    try:
        response_veh = UserVehicleListView.as_view()(request_veh)
        print("UserVehicleListView Status:", response_veh.status_code)
        print("UserVehicleListView Data:", response_veh.data)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_tests()
