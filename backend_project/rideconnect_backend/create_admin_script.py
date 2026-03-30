import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rideconnect_backend.settings")
django.setup()

from django.contrib.auth.models import User
from ride.models import Admin

def create_admin():
    email = "drivemate.rideconnect@gmail.com"
    password = "Rideconnect@67"
    
    # Remove any old superusers so ONLY the new one exists
    User.objects.filter(is_superuser=True).exclude(email=email).delete()

    user, created = User.objects.get_or_create(
        username=email,
        defaults={
            'email': email,
            'first_name': 'Super',
            'last_name': 'Admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    
    if created:
        user.set_password(password)
        user.save()
        print(f"Created superuser: {email}")
    else:
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"Updated existing user to superuser: {email}")

    admin_profile, admin_created = Admin.objects.get_or_create(user=user)
    if admin_created:
        print(f"Created Admin profile for: {email}")
    else:
        print(f"Admin profile already exists for: {email}")

if __name__ == "__main__":
    create_admin()
