from rest_framework import serializers
from .models import Ride, Customer, Driver, CarBrand, CarModel, UserVehicle, UserVehicleImage, UserPreference
from django.contrib.auth.models import User

class UserBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'email']

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'first_name', 'email', 'password', 'role']

    def create(self, validated_data):
        role = validated_data.pop('role', 'customer')
        password = validated_data.pop('password')
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name', '')
        
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=first_name,
            **validated_data
        )
        user.set_password(password)
        user.save()

        # Create corresponding profile
        if role == 'driver':
            Driver.objects.create(user=user, phone=self.initial_data.get('phone', ''))
        else:
            Customer.objects.create(user=user, phone=self.initial_data.get('phone', ''))
        
        return user

class CustomerBriefSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)
    class Meta:
        model = Customer
        fields = ['id', 'user', 'phone']

class DriverBriefSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)
    class Meta:
        model = Driver
        fields = ['id', 'user', 'phone', 'verification_status', 'vehicle_type', 'total_earnings']

class CarBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarBrand
        fields = ['id', 'brand_name']

class CarModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarModel
        fields = ['id', 'brand', 'model_name']

class UserVehicleImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserVehicleImage
        fields = ['id', 'image']

class UserVehicleSerializer(serializers.ModelSerializer):
    images = UserVehicleImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = UserVehicle
        fields = [
            'id', 'vehicle_type', 'brand', 'model_name', 'registration_number', 
            'fuel_type', 'transmission', 'load_capacity', 'images'
        ]

class RideSerializer(serializers.ModelSerializer):
    customer = CustomerBriefSerializer(read_only=True)
    driver = DriverBriefSerializer(read_only=True)
    vehicle = UserVehicleSerializer(read_only=True)
    
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), source='customer', write_only=True
    )
    driver_id = serializers.PrimaryKeyRelatedField(
        queryset=Driver.objects.all(), source='driver', write_only=True, required=False
    )
    vehicle_id = serializers.PrimaryKeyRelatedField(
        queryset=UserVehicle.objects.all(), source='vehicle', write_only=True, required=False
    )
    
    customer_name = serializers.SerializerMethodField()
    driver_name = serializers.SerializerMethodField()

    def get_customer_name(self, obj):
        if obj.customer:
            name = f"{obj.customer.user.first_name} {obj.customer.user.last_name}".strip()
            return name or obj.customer.user.username
        return "Unknown"

    def get_driver_name(self, obj):
        if obj.driver:
            name = f"{obj.driver.user.first_name} {obj.driver.user.last_name}".strip()
            return name or obj.driver.user.username
        return "Not Assigned"

    class Meta:
        model = Ride
        fields = [
            'id', 'customer', 'customer_id', 'customer_name',
            'driver', 'driver_id', 'driver_name', 'vehicle', 'vehicle_id',
            'vehicle_type', 'pickup_location', 'destination', 
            'pickup_lat', 'pickup_lng',
            'drop_lat', 'drop_lng', 'duration_text', 'duration_seconds',
            'distance', 'estimated_fare', 'total_fare', 'is_pickup_drop', 'is_daily_package', 'waiting_charge', 'waiting_time',
            'onward_distance', 'return_distance', 'base_fare', 
            'extra_distance', 'extra_charge', 'onward_fare', 'return_fare',
            'status', 'created_at', 'updated_at', 'surge_amount',
            'scheduled_time', 'start_time', 'end_time', 'commission_amount', 'driver_amount', 'otp'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'otp', 
            'commission_amount', 'driver_amount', 
            'start_time', 'end_time'
        ]

class RidePublicSerializer(RideSerializer):
    """Excludes OTP for non-customer views."""
    class Meta(RideSerializer.Meta):
        fields = [f for f in RideSerializer.Meta.fields if f != 'otp']


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = ['theme_mode', 'theme_color']
