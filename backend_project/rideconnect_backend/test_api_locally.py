import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth.models import User
from ride.views import UserProfileView

# Create a mock request
factory = RequestFactory()
username = "sripadamprasannakumar@gmail.com"
try:
    user = User.objects.get(username=username)
    request = factory.get('/api/user-profile/')
    request.user = user
    request.META['HTTP_HOST'] = '127.0.0.1:8000' # Required for build_absolute_uri
    
    view = UserProfileView.as_view()
    response = view(request)
    print(f"Status Code: {response.status_code}")
    print(f"Data: {response.data}")

except User.DoesNotExist:
    print(f"User {username} not found")
except Exception as e:
    import traceback
    traceback.print_exc()
