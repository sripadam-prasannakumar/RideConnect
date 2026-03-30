import os
import sys
sys.path.append(r"c:\Users\Lenovo\Desktop\Ride Connect\backend_project\rideconnect_backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rideconnect_backend.settings")
import django
django.setup()

from django.contrib.auth.models import User
from ride.models import Customer, Driver

def inspect_db():
    print("--- Users ---")
    for u in User.objects.all():
        roles = []
        if hasattr(u, 'customer'): roles.append('Customer')
        if hasattr(u, 'driver'): roles.append('Driver')
        if u.is_staff: roles.append('Admin')
        print(f"ID: {u.id}, Email: {u.email}, Roles: {', '.join(roles)}")

if __name__ == "__main__":
    inspect_db()
