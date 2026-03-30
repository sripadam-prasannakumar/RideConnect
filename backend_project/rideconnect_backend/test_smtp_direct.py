import os
import django
from django.core.mail import send_mail
from django.conf import settings

# Setup Django environment
import sys
project_path = "c:/Users/Lenovo/Desktop/Ride Connect/backend_project/rideconnect_backend"
sys.path.append(project_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

def test_manual_email():
    print(f"Testing email sending from: {settings.EMAIL_HOST_USER}")
    try:
        subject = 'RideConnect SMTP Discovery Test'
        message = 'If you see this, your SMTP settings are working correctly.'
        recipient_list = [settings.EMAIL_HOST_USER] # Send to self
        
        sent = send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            recipient_list,
            fail_silently=False,
        )
        print(f"Email sent successfully! (Return value: {sent})")
    except Exception as e:
        print(f"FAILED to send email: {type(e).__name__}: {e}")

if __name__ == "__main__":
    test_manual_email()
