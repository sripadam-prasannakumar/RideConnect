import os
import django
import random
from django.utils import timezone

# Setup Django
import sys
sys.path.append('c:\\Users\\Lenovo\\Desktop\\Ride Connect\\backend_project\\rideconnect_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from ride.models import User, Customer, Driver, Ride

def seed_accepted_ride():
    # Find or create a customer
    user_c, _ = User.objects.get_or_create(username='test_customer', email='customer@example.com')
    customer, _ = Customer.objects.get_or_create(user=user_c)
    
    # Find or create a driver
    user_d, _ = User.objects.get_or_create(username='test_driver', email='driver@example.com')
    driver, _ = Driver.objects.get_or_create(user=user_d)
    
    # Create an accepted ride
    ride = Ride.objects.create(
        customer=customer,
        driver=driver,
        pickup_location="Times Square, NY",
        drop_location="Central Park, NY",
        pickup_lat=40.7580,
        pickup_lng=-73.9855,
        drop_lat=40.7829,
        drop_lng=-73.9654,
        selected_vehicle_type='car',
        status='accepted',
        price=300.00,
        otp=str(random.randint(1000, 9999))
    )
    
    print(f"Created accepted ride with ID: {ride.id} and OTP: {ride.otp}")
    return ride.id

if __name__ == "__main__":
    seed_accepted_ride()
