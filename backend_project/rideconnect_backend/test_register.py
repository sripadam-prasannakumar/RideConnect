import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from ride.serializers import UserSerializer

data = {
    'first_name': 'Test User',
    'email': 'test_duplicate@example.com',
    'password': 'password123',
    'role': 'driver',
    'phone': '1234567890'
}

serializer = UserSerializer(data=data)
if serializer.is_valid():
    try:
        user = serializer.save()
        print(f"Success! User created: {user.username}")
    except Exception as e:
        print(f"FAILED with error: {e}")
else:
    print(f"Serializer errors: {serializer.errors}")
