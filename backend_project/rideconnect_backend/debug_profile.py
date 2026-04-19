import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from django.contrib.auth.models import User
from ride.models import Customer, Driver

username = "sripadamprasannakumar@gmail.com"
try:
    user = User.objects.get(username=username)
    print(f"User found: {user.username}")
    
    # Try to simulate UserProfileView.get
    role = 'driver' if hasattr(user, 'driver') else 'customer'
    print(f"Role: {role}")
    
    profile = getattr(user, role, None)
    if not profile:
        print("NO PROFILE FOUND")
    else:
        print(f"Profile found: {profile}")
        print(f"Full name: {profile.full_name}")
        print(f"Phone: {profile.phone}")
        print(f"Profile Picture: {profile.profile_picture}")
        if profile.profile_picture:
            print(f"Profile Picture URL: {profile.profile_picture.url}")
        
        # Build data dict
        data = {
            "full_name": profile.full_name or f"{user.first_name} {user.last_name}".strip() or user.username,
            "email": user.email,
            "phone": profile.phone or "—",
            "role": role,
            "profile_image": profile.profile_picture.url if profile.profile_picture else None,
            "address": getattr(profile, 'address', '') if role == 'driver' else ''
        }
        print("Data built successfully:", data)

except User.DoesNotExist:
    print(f"User {username} not found")
except Exception as e:
    import traceback
    print("ERROR OCCURRED:")
    traceback.print_exc()
