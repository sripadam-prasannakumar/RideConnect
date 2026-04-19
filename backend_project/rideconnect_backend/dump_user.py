import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()
from django.contrib.auth.models import User
try:
    u = User.objects.get(username='sripadamprasannakumar@gmail.com')
    print(f"User: {u}")
    print(f"Has driver: {hasattr(u, 'driver')}")
    print(f"Has customer: {hasattr(u, 'customer')}")
    if hasattr(u, 'driver'):
        d = u.driver
        print(f"Driver ID: {d.id}, Full Name: {d.full_name}, Phone: {d.phone}")
        print(f"Driver Fields: {d.__dict__}")
    if hasattr(u, 'customer'):
        c = u.customer
        print(f"Customer ID: {c.id}, Full Name: {c.full_name}, Phone: {c.phone}")
        print(f"Customer Fields: {c.__dict__}")
except Exception as e:
    print(f"Error: {e}")
