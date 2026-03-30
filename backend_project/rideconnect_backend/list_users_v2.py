import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from django.contrib.auth.models import User

print("--- Users and Roles ---")
for user in User.objects.all():
    role = "Unknown"
    if hasattr(user, 'customer'):
        role = "Customer"
    elif hasattr(user, 'driver'):
        role = f"Driver ({user.driver.verification_status})"
    elif hasattr(user, 'admin_profile'):
        role = "Admin"
    
    print(f"User: {user.username}, Email: {user.email}, Role: {role}")

print("\n--- Summary ---")
print(f"Total Users: {User.objects.count()}")
