import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from django.contrib.auth.models import User
from ride.models import Profile

print("--- Users ---")
for user in User.objects.all():
    profile = getattr(user, 'profile', None)
    role = profile.role if profile else "No Profile"
    print(f"User: {user.username}, Email: {user.email}, Role: {role}")

print("\n--- Summary ---")
print(f"Total Users: {User.objects.count()}")
