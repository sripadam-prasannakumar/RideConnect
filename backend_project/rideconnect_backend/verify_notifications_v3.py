import os
import django
import json
from unittest.mock import MagicMock, patch

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from ride.models import Ride, Driver, Customer, UserVehicle
from ride.views import RideRequestView
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth.models import User

def verify_full_ride_request_flow():
    print("--- Verifying Full Ride Request Flow ---")
    
    factory = APIRequestFactory()
    user = User.objects.filter(is_active=True).first()
    if not user:
        user = User.objects.create_user(username='testuser@example.com', password='password', first_name='Test')
    
    customer, _ = Customer.objects.get_or_create(user=user)
    
    # Ensure we have a driver
    driver_user = User.objects.filter(username='driver@example.com').first()
    if not driver_user:
        driver_user = User.objects.create_user(username='driver@example.com', password='password', first_name='Driver')
    
    driver, _ = Driver.objects.get_or_create(user=driver_user)
    driver.is_online = True
    driver.verification_status = 'verified'
    driver.vehicle_type = 'car'
    driver.current_lat = 12.9710
    driver.current_lng = 77.6410
    driver.save()
    
    # Create a vehicle for the ride
    vehicle, _ = UserVehicle.objects.get_or_create(
        user=user, 
        vehicle_type='car', 
        brand='Toyota', 
        model_name='Camry', 
        registration_number='KA01AB1234'
    )

    data = {
        "pickup_location": "Indiranagar",
        "destination": "Majestic",
        "pickup_lat": 12.9716,
        "pickup_lng": 77.6412,
        "drop_lat": 12.9774,
        "drop_lng": 77.5729,
        "distance": 10.5,
        "selected_vehicle_type": "car",
        "price": 500
    }

    request = factory.post('/api/ride/request/', data, format='json')
    force_authenticate(request, user=user)
    
    view = RideRequestView.as_view()
    
    print("Executing RideRequestView.post...")
    with patch('ride.views.get_channel_layer') as mocked_get_layer:
        mock_layer = MagicMock()
        async def mock_group_send(group, message):
            pass
        mock_layer.group_send = MagicMock(side_effect=mock_group_send)
        mocked_get_layer.return_value = mock_layer
        
        response = view(request)
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Data: {response.data}")
        
        if response.status_code == 201:
            print("SUCCESS: Ride created.")
            # Verify channel layer was called
            if mock_layer.group_send.called:
                print("SUCCESS: channel_layer.group_send was called!")
                call_args = mock_layer.group_send.call_args_list[0]
                print(f"Call group: {call_args[0][0]}")
                message_data = call_args[0][1]
                print(f"Message Type: {message_data['type']}")
                print(f"Message Data: {json.dumps(message_data['data'], indent=2)}")
                
                # Check fields
                required_fields = ['ride_id', 'pickup_location', 'destination', 'estimated_fare', 'vehicle_type']
                all_fields_present = all(field in message_data['data'] for field in required_fields)
                if all_fields_present:
                    print("SUCCESS: All required notification fields are present!")
                else:
                    print(f"FAILED: Missing fields in {message_data['data'].keys()}")
            else:
                print("FAILED: channel_layer.group_send was NOT called.")
        else:
            print(f"FAILED: Status {response.status_code}")
            print(response.data)

if __name__ == "__main__":
    verify_full_ride_request_flow()
