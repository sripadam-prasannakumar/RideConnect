import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from django.contrib.auth.models import User
from ride.models import Customer, Driver, Admin

users = User.objects.all()
created_count = 0
already_ok = 0

for u in users:
    has_cust = hasattr(u, 'customer')
    has_driv = hasattr(u, 'driver')
    has_adm = hasattr(u, 'admin_profile')
    
    if not (has_cust or has_driv or has_adm):
        # Default to customer if no profile exists
        Customer.objects.create(user=u)
        created_count += 1
        print(f"Fixed user: {u.username} (added Customer profile)")
    else:
        already_ok += 1

print(f"Summary: Created {created_count} profiles. {already_ok} users were already fine.")
