import os
import sys
import django

# Add the project root to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from ride.views import AdminDashboardStatsView
from django.contrib.auth.models import User

factory = APIRequestFactory()
admin_user = User.objects.filter(is_staff=True).first()
if not admin_user:
    admin_user = User.objects.create_superuser('temp_admin_2', 'admin2@test.com', 'password')

request = factory.get('/api/admin/stats/')
force_authenticate(request, user=admin_user)

view = AdminDashboardStatsView.as_view()
try:
    response = view(request)
    print(f"Status Code: {response.status_code}")
    print(f"Data: {response.data}")
except Exception as e:
    import traceback
    traceback.print_exc()
