import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from ride.models import Driver, Customer, UserVehicle

print("Drivers:")
for d in Driver.objects.all():
    print(f"  - {d.user.username} (Verified: {d.verification_status}, Online: {d.is_online})")

print("\nCustomers:")
for c in Customer.objects.all():
    print(f"  - {c.user.username}")

print("\nVehicles:")
for v in UserVehicle.objects.all():
    print(f"  - {v.user.username}: {v.brand} {v.model_name} ({v.vehicle_type})")
