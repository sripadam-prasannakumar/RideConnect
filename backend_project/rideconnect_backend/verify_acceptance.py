import os
import django
import json
from unittest.mock import MagicMock, patch

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from ride.models import Ride, Driver, Customer
from ride.views import RideAcceptView
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth.models import User

def verify_ride_acceptance_flow():
    print("--- Verifying Ride Acceptance Flow ---")
    
    factory = APIRequestFactory()
    
    # Setup Customer and Ride
    customer_user, _ = User.objects.get_or_create(username='customer@example.com')
    customer, _ = Customer.objects.get_or_create(user=customer_user)
    
    ride = Ride.objects.create(
        customer=customer,
        pickup_location="Indiranagar",
        destination="Majestic",
        estimated_fare=500,
        status='searching',
        vehicle_type='car'
    )
    
    # Setup Driver
    driver_user, _ = User.objects.get_or_create(username='driver@example.com')
    driver, _ = Driver.objects.get_or_create(user=driver_user)
    driver.verification_status = 'verified'
    driver.save()

    data = {"email": "driver@example.com"}
    request = factory.post(f'/api/ride/accept/{ride.id}/', data, format='json')
    force_authenticate(request, user=driver_user)
    
    view = RideAcceptView.as_view()
    
    print(f"Executing RideAcceptView.post for Ride ID: {ride.id}...")
    with patch('ride.views.get_channel_layer') as mocked_get_layer:
        mock_layer = MagicMock()
        async def mock_group_send(group, message):
            pass
        mock_layer.group_send = MagicMock(side_effect=mock_group_send)
        mocked_get_layer.return_value = mock_layer
        
        response = view(request, ride_id=ride.id)
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            print("SUCCESS: Ride accepted.")
            # Verify channel layer was called for ride_taken
            calls = mock_layer.group_send.call_args_list
            ride_taken_call = None
            for call in calls:
                if call[0][1].get('type') == 'ride_taken':
                    ride_taken_call = call
                    break
            
            if ride_taken_call:
                print(f"SUCCESS: 'ride_taken' notification sent to group: {ride_taken_call[0][0]}")
                print(f"Message Data: {json.dumps(ride_taken_call[0][1], indent=2)}")
            else:
                print("FAILED: 'ride_taken' notification NOT sent.")
        else:
            print(f"FAILED: Status {response.status_code}")
            print(response.data)

    # Cleanup
    ride.delete()

if __name__ == "__main__":
    verify_ride_acceptance_flow()
