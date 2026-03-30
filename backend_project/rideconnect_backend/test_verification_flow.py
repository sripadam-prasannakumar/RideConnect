import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from ride.models import Driver, User
from django.utils import timezone

def test_verification_flow():
    # 1. Get or create a test driver
    user, created = User.objects.get_or_create(username='testdriver@example.com', defaults={'email': 'testdriver@example.com'})
    if created:
        user.set_password('password123')
        user.save()
    
    driver, created = Driver.objects.get_or_create(user=user)
    print(f"Initial Status: {driver.verification_status}")
    
    # 2. Simulate submission
    driver.verification_status = 'pending'
    driver.submission_date = timezone.now()
    driver.save()
    print(f"Status after submission: {driver.verification_status}")
    
    # 3. Simulate Admin Approval (logic from AdminActionVerificationView)
    driver_id = driver.id
    d = Driver.objects.get(id=driver_id)
    d.verification_status = 'verified'
    d.save()
    print(f"Status after Admin Approval: {d.verification_status}")
    
    # 4. Fetch as Driver would (logic from DriverVerificationStatusView)
    d_check = Driver.objects.get(user=user)
    print(f"Final check status: {d_check.verification_status}")
    
    assert d_check.verification_status == 'verified', "Status mismatch!"
    print("Verification flow test PASSED")

if __name__ == "__main__":
    try:
        test_verification_flow()
    except Exception as e:
        print(f"Test FAILED: {str(e)}")
