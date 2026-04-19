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
    full_name = serializers.CharField(write_only=True, required=False)
    phone = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'first_name', 'email', 'password', 'role', 'full_name', 'phone']

    def create(self, validated_data):
        role = validated_data.pop('role', 'customer')
        password = validated_data.pop('password')
        email = validated_data.pop('email')
        full_name = validated_data.pop('full_name', '')
        phone = validated_data.pop('phone', '')
        
        # Use email as username
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=full_name.split()[0] if full_name else '',
            last_name=' '.join(full_name.split()[1:]) if full_name and len(full_name.split()) > 1 else '',
        )
        user.set_password(password)
        user.save()

        # Create corresponding profile
        if role == 'driver':
            Driver.objects.create(user=user, phone=phone, full_name=full_name)
        else:
            Customer.objects.create(user=user, phone=phone, full_name=full_name)
        
        return user

class CustomerBriefSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)
    profile_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = ['id', 'user', 'phone', 'full_name', 'profile_image']
        
    def get_profile_image(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

class DriverBriefSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)
    profile_image = serializers.SerializerMethodField()
    license_plate = serializers.CharField(source='vehicle_number', read_only=True)
    vehicle_details = serializers.CharField(source='vehicle_model', read_only=True)
    
    class Meta:
        model = Driver
        fields = [
            'id', 'user', 'phone', 'full_name', 'profile_image', 
            'verification_status', 'vehicle_type', 'total_earnings', 
            'total_commission_pending', 'total_commission_paid', 'net_balance',
            'upi_id', 'vehicle_number', 'vehicle_model',
            'license_plate', 'vehicle_details',
            'is_bank_details_added', 'masked_account_number'
        ]

    def get_profile_image(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

class DriverFullSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)
    profile_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Driver
        fields = [
            'id', 'user', 'phone', 'full_name', 'profile_picture', 'profile_image',
            'verification_status', 'vehicle_type', 'total_earnings', 
            'total_commission_pending', 'total_commission_paid', 'net_balance',
            'upi_id', 'vehicle_number', 'vehicle_model', 'address',
            'bank_account_holder_name', 'bank_account_number', 'bank_ifsc_code',
            'is_bank_details_added', 'masked_account_number'
        ]
        read_only_fields = ['verification_status', 'total_earnings', 'total_commission_pending', 'total_commission_paid', 'net_balance', 'is_bank_details_added', 'masked_account_number']

    def get_profile_image(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

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
            'fuel_type', 'transmission', 'load_capacity', 'images', 'is_custom'
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
        queryset=UserVehicle.objects.all(), source='vehicle', write_only=True, required=False, allow_null=True
    )
    
    customer_name = serializers.SerializerMethodField()
    driver_name = serializers.SerializerMethodField()

    def get_customer_name(self, obj):
        if obj.customer:
            return obj.customer.full_name or f"{obj.customer.user.first_name} {obj.customer.user.last_name}".strip() or obj.customer.user.username
        return "Unknown"

    def get_driver_name(self, obj):
        if obj.driver:
            return obj.driver.full_name or f"{obj.driver.user.first_name} {obj.driver.user.last_name}".strip() or obj.driver.user.username
        return "Not Assigned"

    paymentStatus = serializers.CharField(source='payment_status', read_only=True)
    
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
            'scheduled_time', 'start_time', 'end_time', 'commission_amount', 'driver_amount', 
            'cargo_capacity', 'load_type', 'load_charge', 'night_charge', 'otp', 
            'paymentStatus', 'payment_method'
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

class RideStatusSerializer(serializers.ModelSerializer):
    ride_id = serializers.IntegerField(source='id')
    driver = DriverBriefSerializer(read_only=True)
    driver_lat = serializers.SerializerMethodField()
    driver_lng = serializers.SerializerMethodField()
    paymentStatus = serializers.CharField(source='payment_status', read_only=True)

    def get_driver_lat(self, obj):
        return obj.driver.current_lat if obj.driver else None

    def get_driver_lng(self, obj):
        return obj.driver.current_lng if obj.driver else None

    class Meta:
        model = Ride
        fields = [
            'ride_id', 'status', 'driver', 'total_fare', 'estimated_fare', 
            'distance', 'otp', 'paymentStatus', 'payment_method',
            'pickup_lat', 'pickup_lng', 'drop_lat', 'drop_lng',
            'driver_lat', 'driver_lng'
        ]

class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = ['theme_mode', 'theme_color']
