from django.db import models
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone


class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer')
    phone = models.CharField(max_length=15, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    is_online = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} (Customer)"


class Driver(models.Model):
    VERIFICATION_STATUS = [
        ('unverified', 'Unverified'),
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    VEHICLE_TYPES = [
        ('car', 'Car'),
        ('bike', 'Bike'),
        ('cargo', 'Cargo / Goods Vehicle'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='driver')
    phone = models.CharField(max_length=15, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/drivers/', blank=True, null=True)
    
    # Driving License details
    license_number = models.CharField(max_length=50, blank=True)
    license_type = models.CharField(max_length=50, blank=True)
    vehicle_type = models.CharField(max_length=50, blank=True)  # Car, Bike, Cargo
    license_expiry = models.DateField(null=True, blank=True)
    license_image = models.ImageField(upload_to='licenses/', blank=True, null=True)
    license_image_back = models.ImageField(upload_to='licenses/back/', null=True, blank=True)
    
    # New fields for manual verification
    full_name = models.CharField(max_length=200, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    verification_status = models.CharField(
        max_length=20, choices=VERIFICATION_STATUS, default='unverified'
    )
    submission_date = models.DateTimeField(null=True, blank=True)
    is_online = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    last_active = models.DateTimeField(null=True, blank=True)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    current_lat = models.FloatField(null=True, blank=True)
    current_lng = models.FloatField(null=True, blank=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__original_status = self.verification_status

    def save(self, *args, **kwargs):
        if self.verification_status == 'pending' and self.__original_status != 'pending':
            self.submission_date = timezone.now()
            
        if self.pk and self.verification_status == 'verified' and self.__original_status != 'verified':
            self.send_approval_email()
        elif self.pk and self.verification_status == 'rejected' and self.__original_status != 'rejected':
            self.send_rejection_email()
            
        super().save(*args, **kwargs)
        self.__original_status = self.verification_status

    def send_approval_email(self):
        subject = "Verification Successful"
        message = "Your driving license has been successfully verified. You can now access all driver features."
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [self.user.email], fail_silently=False)

    def send_rejection_email(self):
        subject = "Verification Rejected"
        message = "Your verification has been rejected. Please re-submit correct details."
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [self.user.email], fail_silently=False)

    def __str__(self):
        return f"{self.user.username} (Driver - {self.verification_status})"


class Admin(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    phone = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return f"{self.user.username} (Admin)"


class LicenseVerificationResult(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('failed', 'Failed'),
        ('error', 'Error'),
    ]
    driver = models.OneToOneField('Driver', on_delete=models.CASCADE, related_name='license_verification')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    # Government-fetched data
    govt_name = models.CharField(max_length=200, blank=True)
    govt_dob = models.CharField(max_length=20, blank=True)
    govt_license_type = models.CharField(max_length=100, blank=True)
    govt_expiry = models.CharField(max_length=20, blank=True)
    govt_address = models.TextField(blank=True)
    govt_raw_response = models.JSONField(default=dict, blank=True)
    # Mismatch details
    mismatches = models.JSONField(default=list, blank=True)
    error_message = models.TextField(blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.driver.user.username} - {self.status}"


class EmailOTP(models.Model):
    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.email} - {self.otp}"


class CarBrand(models.Model):
    brand_name = models.CharField(max_length=100, unique=True)
    logo = models.ImageField(upload_to='car_logos/', blank=True, null=True)

    def __str__(self):
        return self.brand_name


class CarModel(models.Model):
    brand = models.ForeignKey(CarBrand, on_delete=models.CASCADE, related_name='models')
    model_name = models.CharField(max_length=100)

    class Meta:
        unique_together = ('brand', 'model_name')

    def __str__(self):
        return f"{self.brand.brand_name} {self.model_name}"


class UserVehicle(models.Model):
    VEHICLE_TYPES = [
        ('car', 'Car'),
        ('bike', 'Bike'),
        ('cargo', 'Cargo / Goods Vehicle'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicles')
    vehicle_type = models.CharField(max_length=10, choices=VEHICLE_TYPES, default='car')
    brand = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    registration_number = models.CharField(max_length=20)
    fuel_type = models.CharField(max_length=20)
    transmission = models.CharField(max_length=20)
    load_capacity = models.FloatField(null=True, blank=True, help_text="Load capacity in kg (for cargo vehicles)")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.brand} {self.model_name} ({self.registration_number})"


class UserVehicleImage(models.Model):
    vehicle = models.ForeignKey(UserVehicle, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='user_vehicles/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.vehicle.registration_number}"


class Ride(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('searching', 'Searching'),
        ('accepted', 'Accepted'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    VEHICLE_TYPES = [
        ('car', 'Car'),
        ('bike', 'Bike'),
        ('cargo', 'Cargo / Goods Vehicle'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='rides_as_customer')
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name='rides_as_driver')
    vehicle = models.ForeignKey(UserVehicle, on_delete=models.SET_NULL, null=True, blank=True, related_name='rides')
    vehicle_type = models.CharField(max_length=10, choices=VEHICLE_TYPES, default='car')
    pickup_location = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    pickup_lat = models.FloatField(null=True, blank=True)
    pickup_lng = models.FloatField(null=True, blank=True)
    drop_lat = models.FloatField(null=True, blank=True)
    drop_lng = models.FloatField(null=True, blank=True)
    duration_text = models.CharField(max_length=50, blank=True)
    duration_seconds = models.IntegerField(default=0)
    distance = models.FloatField(default=0.0)
    estimated_fare = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='searching')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    scheduled_time = models.DateTimeField(null=True, blank=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    driver_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_pickup_drop = models.BooleanField(default=False)
    is_daily_package = models.BooleanField(default=False)
    waiting_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    waiting_time = models.IntegerField(default=0)  # in minutes
    total_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # New fare breakdown fields
    onward_distance = models.FloatField(default=0.0)
    return_distance = models.FloatField(default=0.0)
    base_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    extra_distance = models.FloatField(default=0.0)
    extra_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    onward_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    return_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Surge fields
    surge_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    otp = models.CharField(max_length=6, null=True, blank=True)

    def __str__(self):
        return f"Ride {self.id} - {self.customer.user.username} to {self.destination}"


class UserPreference(models.Model):
    THEME_MODES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
    ]
    THEME_COLORS = [
        ('default', 'Default'),
        ('blue', 'Blue'),
        ('green', 'Green'),
        ('orange', 'Orange'),
        ('purple', 'Purple'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preference')
    theme_mode = models.CharField(max_length=10, choices=THEME_MODES, default='dark')
    theme_color = models.CharField(max_length=20, choices=THEME_COLORS, default='default')

    def __str__(self):
        return f"Preferences for {self.user.username}"
