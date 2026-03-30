import os
import django
import json
from unittest.mock import MagicMock, patch

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from ride.models import Ride, Driver, Customer
from ride.serializers import RidePublicSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def verify_ride_notification_logic():
    print("--- Verifying Ride Notification Logic ---")
    
    # 1. Mock a ride
    customer = Customer.objects.first()
    if not customer:
        print("No customer found in DB. Please seed the database first.")
        return

    ride = Ride.objects.create(
        customer=customer,
        pickup_location="Indiranagar, Bangalore",
        destination="Majestic, Bangalore",
        pickup_lat=12.9716,
        pickup_lng=77.6412,
        estimated_fare=500,
        total_fare=500,
        status='searching',
        vehicle_type='car'
    )
    print(f"Created Test Ride ID: {ride.id}")

    # 2. Mock online drivers nearby
    # Ensure at least one driver is online and nearby
    driver = Driver.objects.first()
    if not driver:
        print("No driver found in DB.")
        return
    
    driver.is_online = True
    driver.verification_status = 'verified'
    driver.vehicle_type = 'car'
    driver.current_lat = 12.9710 # Very close to 12.9716
    driver.current_lng = 77.6410
    driver.save()
    print(f"Setup Test Driver: {driver.user.username} (ID: {driver.id})")

    # 3. Simulate the notification logic from RideRequestView
    channel_layer = get_channel_layer()
    
    # We'll patch group_send to see if it's called
    with patch.object(channel_layer, 'group_send', side_effect=async_to_sync(channel_layer.group_send)) as mocked_send:
        # Filtering logic
        online_drivers = Driver.objects.filter(
            is_online=True, 
            verification_status='verified',
            vehicle_type=ride.vehicle_type
        )
        
        # Simplified haversine for test
        nearby_drivers = [d for d in online_drivers] # In test, we assume they are nearby
        
        print(f"Found {len(nearby_drivers)} nearby drivers.")
        
        for d in nearby_drivers:
            group_name = f'driver_{d.id}'
            print(f"Sending notification to group: {group_name}")
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "send_ride_request",
                    "data": {
                        "ride_id": ride.id,
                        "pickup_location": ride.pickup_location,
                        "destination": ride.destination,
                        "estimated_fare": str(ride.total_fare),
                        "vehicle_type": ride.vehicle_type,
                        "duration_text": "15 mins",
                        "distance": 5.2
                    }
                }
            )

        # Check if mocked_send was called correctly
        print(f"Mocked send call count: {mocked_send.call_count}")
        if mocked_send.call_count > 0:
            last_call = mocked_send.call_args_list[0]
            print(f"Last call args: {last_call}")
            if f'driver_{driver.id}' in str(last_call):
                print("SUCCESS: Notification sent to correct driver group!")
            if 'estimated_fare' in str(last_call):
                print("SUCCESS: Data structure contains 'estimated_fare'!")
        else:
            print("FAILED: No notifications sent.")

    # Cleanup
    ride.delete()

if __name__ == "__main__":
    verify_ride_notification_logic()
