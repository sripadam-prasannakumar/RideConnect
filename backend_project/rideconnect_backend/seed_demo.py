import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rideconnect_backend.settings")
django.setup()

from django.contrib.auth.models import User
from ride.models import Driver, Customer

def seed_demo_data():
    # Demo Driver
    driver_email = "driver@rideconnect.com"
    driver_pass = "password123"
    
    user, created = User.objects.get_or_create(
        username=driver_email,
        defaults={
            'email': driver_email,
            'first_name': 'Demo',
            'last_name': 'Driver',
            'is_active': True
        }
    )
    if created or not user.check_password(driver_pass):
        user.set_password(driver_pass)
        user.is_active = True
        user.save()
        print(f"Set up user: {driver_email}")

    driver, d_created = Driver.objects.get_or_create(
        user=user,
        defaults={
            'phone': '1234567890',
            'verification_status': 'verified',
            'is_email_verified': True,
            'vehicle_type': 'car'
        }
    )
    if d_created:
        print(f"Created Driver profile for: {driver_email}")

    # Demo Customer
    customer_email = "customer@rideconnect.com"
    customer_pass = "password123"

    user, created = User.objects.get_or_create(
        username=customer_email,
        defaults={
            'email': customer_email,
            'first_name': 'Demo',
            'last_name': 'Customer',
            'is_active': True
        }
    )
    if created or not user.check_password(customer_pass):
        user.set_password(customer_pass)
        user.is_active = True
        user.save()
        print(f"Set up user: {customer_email}")

    customer, c_created = Customer.objects.get_or_create(
        user=user,
        defaults={
            'phone': '0987654321',
            'is_email_verified': True
        }
    )
    if c_created:
        print(f"Created Customer profile for: {customer_email}")

if __name__ == "__main__":
    seed_demo_data()
