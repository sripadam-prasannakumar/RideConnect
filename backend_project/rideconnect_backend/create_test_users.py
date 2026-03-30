import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from django.contrib.auth.models import User
from ride.models import Driver, Customer, UserVehicle

def create_user(username, email, password, role):
    user, created = User.objects.get_or_create(username=username, email=email)
    user.set_password(password)
    user.first_name = role.capitalize()
    user.save()
    
    if role == 'driver':
        driver, _ = Driver.objects.get_or_create(user=user)
        driver.verification_status = 'verified'
        driver.vehicle_type = 'car'
        driver.is_online = True
        driver.save()
        
        # Create a vehicle for the driver
        UserVehicle.objects.get_or_create(
            user=user,
            vehicle_type='car',
            brand='Tesla',
            model_name='Model 3',
            registration_number='TS-01-RC-1234'
        )
    else:
        Customer.objects.get_or_create(user=user)
    
    return user

create_user('testdriver', 'testdriver@rideconnect.com', 'Password123!', 'driver')
create_user('testcustomer', 'testcustomer@rideconnect.com', 'Password123!', 'customer')

print("Test users created/updated.")
