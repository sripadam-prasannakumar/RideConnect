import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from ride.views import UserVehicleListView
from django.contrib.auth.models import User

factory = APIRequestFactory()
user = User.objects.first()

data = {
    'brand': 'Toyota',
    'model_name': 'Prius',
    'registration_number': 'AP08TH1441',
    'vehicle_type': 'car',
    'fuel_type': 'petrol',
    'transmission': 'automatic'
}

request = factory.post('/api/user-vehicles/', data, format='multipart')
force_authenticate(request, user=user)
view = UserVehicleListView.as_view()
response = view(request)

print("STATUS:", response.status_code)
print("DATA:", response.data)
