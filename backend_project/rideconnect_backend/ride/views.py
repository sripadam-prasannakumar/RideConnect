import re
from .utils import sanitize_group_name
import random
import math
from decimal import Decimal
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.mail import send_mail
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, logout
from django.db import IntegrityError, transaction
from django.db.models import Sum, Avg, Count
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.conf import settings
from django.db.models import Sum, Q
import googlemaps

from .models import EmailOTP, Customer, Driver, CarBrand, CarModel, UserVehicle, UserVehicleImage, Ride, UserPreference
from .serializers import (
    UserSerializer, CarBrandSerializer, CarModelSerializer, 
    UserVehicleSerializer, RideSerializer, RidePublicSerializer,
    UserBriefSerializer, DriverBriefSerializer, UserPreferenceSerializer, RideStatusSerializer,
    DriverFullSerializer
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, IsAdminUser

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return float('inf')
        
    if any(pos is None for pos in [lat1, lon1, lat2, lon2]):
        return 9999.0 # Safe fallback: far away
        
    # convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r

def calculate_ride_fare(distance_km, is_pickup_drop=False, is_daily_package=False, waiting_time_minutes=0, vehicle_type='car', **kwargs):
    """
    Pricing Logic:
    1. Cargo Vehicle Pricing (New):
       - Specific base and rate for different capacities.
       - Disount for long distances.
       - Night and Surge charges.
    2. Daily Package (Car Only):
       - Fixed ₹1000 for 12 hours / 150 km
    3. Standard Pricing (Car/Bike):
       - Existing logic preserved.
    """
    onward_distance = float(distance_km) or 0.0
    waiting_time_minutes = float(waiting_time_minutes) or 0.0
    
    # Initialize variables
    total_fare = 0.0
    onward_fare = 0.0
    return_fare = 0.0
    base_fare = 0.0
    extra_distance = 0.0
    extra_charge = 0.0
    surcharge = 0.0
    waiting_charge = 0.0
    load_charge = 0.0
    night_charge = 0.0

    is_own_vehicle = kwargs.get('is_own_vehicle', False)
    if vehicle_type == 'cargo' and not is_own_vehicle:
        # Cargo Pricing System
        capacity = kwargs.get('cargo_capacity', '500kg')
        load_type = kwargs.get('load_type', 'Normal')
        
        # 1. Base/Rate mapping
        pricing_map = {
            '500kg': {'base': 150.0, 'rate': 11.0},
            '1 Ton': {'base': 220.0, 'rate': 15.0},
            '1.5 Ton': {'base': 280.0, 'rate': 19.0},
            '2 Ton': {'base': 350.0, 'rate': 23.0},
            '2.5 Ton': {'base': 550.0, 'rate': 29.0},
            '3 Ton': {'base': 750.0, 'rate': 35.0},
        }
        config = pricing_map.get(capacity, pricing_map['500kg'])
        base_fare = config['base']
        rate_per_km = config['rate']
        
        # 2. Trip Logic (Base + Distance*Rate)
        if onward_distance <= 5:
            # If distance <= 5 km -> apply minimum charge (base fare)
            onward_fare = base_fare
        else:
            onward_fare = base_fare + (onward_distance * rate_per_km)
            
        # 3. Discount for > 15km (10% discount on trip fare)
        if onward_distance > 15:
            onward_fare *= 0.9
            
        # 4. Load Type Charges
        load_charges = {
            'Normal': 0.0,
            'Heavy': 100.0,
            'Fragile': 150.0,
            'Furniture': 200.0
        }
        load_charge = load_charges.get(load_type, 0.0)
        
        # 5. Waiting Charges (₹3 per minute)
        waiting_charge = waiting_time_minutes * 3.0
        
        # 6. Night Charges (10PM–6AM): +15% of onward fare
        from django.utils import timezone
        now = timezone.localtime(timezone.now())
        is_night = now.hour >= 22 or now.hour < 6
        if is_night:
            night_charge = onward_fare * 0.15
            
        # 7. Surge Pricing (Fixed 20% for consistency)
        surge_percent = kwargs.get('surge_percent')
        if surge_percent is None:
            surge_percent = 0.20 
        surcharge = onward_fare * float(surge_percent)
        
        total_fare = onward_fare + load_charge + waiting_charge + night_charge + surcharge
        total_distance = onward_distance

    elif vehicle_type == 'bike':
        # Rapido-style Bike Pricing
        base_fare = 22.0
        if onward_distance <= 2: onward_fare = base_fare
        elif onward_distance <= 6:
            extra_distance = onward_distance - 2.0
            extra_charge = extra_distance * 6.0
            onward_fare = base_fare + extra_charge
        else:
            extra_distance = onward_distance - 2.0
            range_2_6_charge = 4.0 * 6.0
            range_over_6_dist = onward_distance - 6.0
            range_over_6_charge = range_over_6_dist * 8.0
            extra_charge = range_2_6_charge + range_over_6_charge
            onward_fare = base_fare + extra_charge
            
        surcharge = 15.0 # Fixed surcharge for consistency
        if waiting_time_minutes > 3:
            waiting_charge = (waiting_time_minutes - 3) * 1.0
            
        total_fare = onward_fare + surcharge + waiting_charge
        total_distance = onward_distance

    else:
        # Existing Car Pricing Logic
        waiting_charge = round((waiting_time_minutes / 60.0) * 35.0, 2)
        if is_daily_package:
            base_fare = 1000.0
            if onward_distance <= 150: extra_charge = 0.0
            else: extra_charge = (onward_distance - 150.0) * 3.0
            onward_fare = base_fare + extra_charge
            total_fare = onward_fare + waiting_charge
            total_distance = onward_distance
            return_distance = 0.0
            return_fare = 0.0
        else:
            base_fare = 600.0
            if onward_distance <= 40: extra_charge = 0.0
            else: extra_charge = (onward_distance - 40.0) * 3.0
            onward_fare = base_fare + extra_charge
            return_distance = 0.0
            return_fare = 0.0
            if is_pickup_drop:
                return_distance = onward_distance
                return_fare = return_distance * 3.0
            total_fare = onward_fare + return_fare + waiting_charge
            total_distance = onward_distance + (return_distance or 0.0)
            
    return {
        'total_fare': round(float(total_fare), 2),
        'onward_fare': round(float(onward_fare), 2),
        'return_fare': round(float(return_fare), 2 if vehicle_type not in ['bike', 'cargo'] else 0),
        'base_fare': round(float(base_fare), 2),
        'extra_distance': round(float(extra_distance), 2),
        'extra_charge': round(float(extra_charge), 2),
        'onward_distance': round(float(onward_distance), 2),
        'return_distance': round(float(return_distance if vehicle_type not in ['bike', 'cargo'] else 0.0), 2),
        'total_distance': round(float(total_distance), 2),
        'waiting_charge': round(float(waiting_charge), 2),
        'waiting_time': int(waiting_time_minutes),
        'surcharge_amount': round(float(surcharge), 2),
        'load_charge': round(float(load_charge), 2),
        'night_charge': round(float(night_charge), 2),
    }

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RideRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
            
        try:
            customer = request.user.customer
        except Exception:
            # Auto-create customer profile if driver tries to book a ride
            customer = Customer.objects.create(
                user=request.user, 
                phone=request.user.driver.phone if hasattr(request.user, 'driver') else ''
            )

        data = request.data.copy()
        data['customer_id'] = customer.id
        
        # Check if advance booking
        scheduled_time = data.get('scheduled_time')
        if scheduled_time:
            data['status'] = 'scheduled'
        else:
            data['status'] = 'searching'
        
        if 'destination' not in data and 'drop_location' in data:
            data['destination'] = data['drop_location']
        if 'estimated_fare' not in data and 'price' in data:
            data['estimated_fare'] = data['price']
        if 'vehicle_type' not in data and 'selected_vehicle_type' in data:
            data['vehicle_type'] = data['selected_vehicle_type']

        # Ensure locations are within char limits (prevent 400 errors from long labels)
        if 'pickup_location' in data:
            data['pickup_location'] = str(data['pickup_location'])[:250]
        if 'destination' in data:
            data['destination'] = str(data['destination'])[:250]

        distance_val = 0.0
        trip_type = data.get('trip_type', 'one_way')
        is_daily_package = (trip_type == 'daily')
        is_pickup_drop = (trip_type == 'round_trip' or trip_type == 'daily')
        
        if 'distance' in data:
            try:
                distance_val = float(data.get('distance', 0))
                data['distance'] = round(distance_val, 2)
            except (TypeError, ValueError):
                data['distance'] = 0.0
        
        # Validation for Bike distance
        if data.get('vehicle_type', 'car').lower() == 'bike' and distance_val > 35:
            return Response({
                "error": "Bike rides are limited to 35 KM. Please choose Car or Cargo for longer trips."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Implement Backend Fare Calculation (Latest Logic)
        fare_details = calculate_ride_fare(
            distance_km=distance_val, 
            is_pickup_drop=is_pickup_drop,
            is_daily_package=is_daily_package,
            waiting_time_minutes=data.get('waiting_time', 0),
            vehicle_type=data.get('vehicle_type', 'car'),
            cargo_capacity=data.get('cargo_capacity'),
            load_type=data.get('load_type'),
            is_own_vehicle=data.get('is_own_vehicle', False),
            surge_percent=data.get('surge_percent')
        )
        
        data['estimated_fare'] = fare_details['total_fare']
        data['total_fare'] = fare_details['total_fare']
        data['is_pickup_drop'] = is_pickup_drop
        data['is_daily_package'] = is_daily_package
        data['waiting_time'] = fare_details['waiting_time']
        data['waiting_charge'] = fare_details['waiting_charge']
        data['surge_amount'] = fare_details.get('surcharge_amount', 0.0)
        
        # Store cargo details
        data['cargo_capacity'] = data.get('cargo_capacity')
        data['load_type'] = data.get('load_type')
        data['load_charge'] = fare_details.get('load_charge', 0.0)
        data['night_charge'] = fare_details.get('night_charge', 0.0)
        
        # Store detailed breakdown
        data['onward_distance'] = fare_details['onward_distance']
        data['return_distance'] = fare_details['return_distance']
        data['base_fare'] = fare_details['base_fare']
        data['extra_distance'] = fare_details['extra_distance']
        data['extra_charge'] = fare_details['extra_charge']
        data['onward_fare'] = fare_details['onward_fare']
        data['return_fare'] = fare_details['return_fare']

        serializer = RideSerializer(data=data)
        if serializer.is_valid():
            ride = serializer.save(customer=customer)
            
            # Generate 4-digit OTP for the ride
            ride.otp = str(random.randint(1000, 9999))
            ride.save()
            
            # Only broadcast if it's an immediate 'searching' ride
            if ride.status == 'searching':
                # Target filtering: Find verified, online drivers who have a matching vehicle type
                # either in their main profile or in their user_vehicles fleet.
                candidate_drivers = Driver.objects.filter(
                    is_online=True, 
                    verification_status='verified'
                ).filter(
                    Q(vehicle_type__iexact=ride.vehicle_type) | 
                    Q(user__vehicles__vehicle_type__iexact=ride.vehicle_type)
                ).distinct()
                
                nearby_drivers = []
                for driver in candidate_drivers:
                    if driver.current_lat is None or driver.current_lng is None:
                        # Fallback for development/new drivers: add to broadcast
                        nearby_drivers.append(driver)
                        continue
                        
                    dist = haversine_distance(
                        ride.pickup_lat, ride.pickup_lng, 
                        driver.current_lat, driver.current_lng
                    )
                    if dist <= 30.0: # Increased search radius for better coverage
                        nearby_drivers.append(driver)
                
                # Notify candidate drivers
                channel_layer = get_channel_layer()
                
                for driver in nearby_drivers:
                    async_to_sync(channel_layer.group_send)(
                        sanitize_group_name(f'driver_{driver.user.id}'),
                        {
                            "type": "send_ride_request",
                            "data": {
                                "ride_id": ride.id,
                                "pickup_location": ride.pickup_location,
                                "destination": ride.destination,
                                "estimated_fare": str(ride.total_fare),
                                "vehicle_type": ride.vehicle_type,
                                "duration_text": ride.duration_text or "Calculating...",
                                "distance": ride.distance,
                                "customer_name": f"{ride.customer.user.first_name} {ride.customer.user.last_name}".strip() or ride.customer.user.username
                            }
                        }
                    )
                
                # Check if no drivers were found
                if not nearby_drivers:
                    # Logs for debugging bike lack of drivers
                    print(f"BROADCAST: No online verified {ride.vehicle_type} drivers found in radius/system.")
                    pass
            
            return Response({
                "message": "Ride created successfully",
                "ride_id": ride.id,
                "status": ride.status,
                "otp": ride.otp
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RideAcceptView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, ride_id):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            driver = Driver.objects.get(user__username=email)
            # Check commission limit
            from .models import PlatformSettings
            settings_obj = PlatformSettings.objects.first()
            limit = settings_obj.commission_limit if settings_obj else 500.00
            if driver.total_commission_pending >= limit:
                return Response({
                    "error": "Commission limit exceeded. Please settle pending commissions to accept new rides.",
                    "pending_amount": float(driver.total_commission_pending)
                }, status=status.HTTP_403_FORBIDDEN)
        except Driver.DoesNotExist:
            return Response({"error": "Driver not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            with transaction.atomic():
                ride = Ride.objects.select_for_update().get(id=ride_id)
                if ride.status != 'searching':
                    return Response({"error": "Ride is no longer available"}, status=status.HTTP_400_BAD_REQUEST)
                
                ride.driver = driver
                # Assign driver's vehicle ONLY if customer didn't provide one
                if not ride.vehicle:
                    driver_vehicle = UserVehicle.objects.filter(user=driver.user, vehicle_type=ride.vehicle_type).first()
                    if driver_vehicle:
                        ride.vehicle = driver_vehicle
                ride.status = 'accepted'
                ride.save()
            
            channel_layer = get_channel_layer()
            
            # 1. Notify the User (Customer)
            async_to_sync(channel_layer.group_send)(
                sanitize_group_name(f'user_{ride.customer.user.id}'),
                {
                    'type': 'ride_update',
                    'ride_status': 'accepted',
                    'driver_data': RideSerializer(ride).data.get('driver'),
                    'ride_data': RideSerializer(ride).data
                }
            )
            
            # Additional Notify by Email (Username) - fallback for some frontend components
            async_to_sync(channel_layer.group_send)(
                sanitize_group_name(f'user_{ride.customer.user.username}'),
                {
                    'type': 'ride_update',
                    'ride_status': 'accepted',
                    'driver_data': RideSerializer(ride).data.get('driver'),
                    'ride_data': RideSerializer(ride).data
                }
            )

            # 2. Notify other drivers to remove it from their feed
            async_to_sync(channel_layer.group_send)(
                sanitize_group_name(f'drivers_{ride.vehicle_type}'),
                {
                    'type': 'ride_taken',
                    'ride_id': ride.id
                }
            )
            
            return Response(RideStatusSerializer(ride).data, status=status.HTTP_200_OK)
        except Ride.DoesNotExist:
            return Response({"error": "Ride not found"}, status=status.HTTP_404_NOT_FOUND)


class RideHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        email = request.query_params.get('email')
        role = request.query_params.get('role')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if role == 'driver':
                rides = Ride.objects.filter(driver__user__username=email).order_by('-created_at')
                serializer = RidePublicSerializer(rides, many=True)
            else:
                rides = Ride.objects.filter(customer__user__username=email).order_by('-created_at')
                serializer = RideSerializer(rides, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            print(f"--- RIDE HISTORY EXCEPTION ---\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AvailableRidesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Handle possible case-sensitivity or whitespace in email query
            email = email.strip()
            driver = Driver.objects.get(Q(user__email__iexact=email) | Q(user__username__iexact=email))
            
            # Identify all vehicle types this driver is eligible for
            # Normalized to lowercase for robust matching
            eligible_types = []
            if driver.vehicle_type:
                eligible_types.append(driver.vehicle_type.lower())
            
            # Additional types from fleet
            fleet_types = list(UserVehicle.objects.filter(user=driver.user).values_list('vehicle_type', flat=True))
            for t in fleet_types:
                if t: eligible_types.append(t.lower())
            
            eligible_types = list(set(eligible_types))
            
            # Filter for rides created in the last 2 hours (more generous for regional tests)
            time_threshold = timezone.now() - timezone.timedelta(hours=2)
            
            # Get potential candidate rides
            rides = Ride.objects.filter(
                status='searching', 
                vehicle_type__in=eligible_types,
                created_at__gte=time_threshold
            ).order_by('-created_at')
            
            # Filter by radius if driver location is known
            filtered_rides = []
            if driver.current_lat is not None and driver.current_lng is not None:
                d_lat, d_lng = float(driver.current_lat), float(driver.current_lng)
                for ride in rides:
                    r_lat, r_lng = float(ride.pickup_lat), float(ride.pickup_lng)
                    dist = haversine_distance(r_lat, r_lng, d_lat, d_lng)
                    # 50 KM search radius to account for regional test scenarios
                    if dist <= 50.0:
                        filtered_rides.append(ride)
            else:
                # Fallback: Just show most recent if no location set
                filtered_rides = list(rides[:10])
            
            # If no nearby matches found, try a wider global match of very recent rides
            if not filtered_rides and rides.exists():
                filtered_rides = list(rides[:2])
            
            serializer = RideSerializer(filtered_rides, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Driver.DoesNotExist:
            return Response({"error": "Driver not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
            except IntegrityError:
                return Response({"email": ["An account with this email already exists."]}, status=status.HTTP_400_BAD_REQUEST)

            user.is_active = False
            user.save()

            otp = str(random.randint(100000, 999999))
            EmailOTP.objects.update_or_create(email=user.email, defaults={'otp': otp})

            try:
                send_mail(
                    'RideConnect - Verify Your Email',
                    f'Verification code: {otp}',
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
            except Exception as e:
                import traceback
                print(f"FAILED TO SEND OTP EMAIL: {str(e)}")
                traceback.print_exc()

            return Response({"message": "OTP sent to your email.", "email": user.email}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp')
        try:
            otp_obj = EmailOTP.objects.get(email=email, otp=otp_code)
            user = User.objects.get(username=email)
            user.is_active = True
            user.save()
            if hasattr(user, 'customer'):
                user.customer.is_email_verified = True
                user.customer.save()
            elif hasattr(user, 'driver'):
                user.driver.is_email_verified = True
                user.driver.save()
            otp_obj.delete()
            
            role = 'customer'
            if hasattr(user, 'driver'): role = 'driver'
            elif user.is_staff: role = 'admin'
            
            tokens = get_tokens_for_user(user)
            return Response({"email": user.email, "name": user.first_name, "role": role, "tokens": tokens}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Invalid OTP or User"}, status=status.HTTP_400_BAD_REQUEST)

class ResendOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        otp = str(random.randint(100000, 999999))
        EmailOTP.objects.update_or_create(email=email, defaults={'otp': otp})
        try:
            send_mail(
                'RideConnect - Your OTP Code',
                f'Your verification code is: {otp}\n\nThis code is valid for 10 minutes.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except Exception as e:
            import traceback
            print(f"FAILED TO RESEND OTP EMAIL: {str(e)}")
            traceback.print_exc()
            return Response({"error": "Failed to send OTP email. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"message": "New OTP sent."})

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(username=email, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            return Response({"error": "Verify email first", "email": email, "require_otp": True}, status=status.HTTP_403_FORBIDDEN)
        
        otp = str(random.randint(100000, 999999))
        EmailOTP.objects.update_or_create(email=email, defaults={'otp': otp})
        try:
            send_mail(
                'RideConnect - Login OTP',
                f'Your login verification code is: {otp}\n\nThis code is valid for 10 minutes.\nIf you did not request this, please ignore this email.',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            import traceback
            print(f"FAILED TO SEND LOGIN OTP EMAIL: {str(e)}")
            traceback.print_exc()
            return Response({"error": "Failed to send OTP email. Please check your internet and try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"message": "OTP sent", "email": user.email, "require_otp": True}, status=status.HTTP_200_OK)

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"message": "Logged out"})

class HomeView(APIView):
    def get(self, request): return Response({"message": "API is running"})

class CalculateFareView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        distance = request.data.get('distance', 0)
        vehicle_type = request.data.get('vehicle_type', 'car')
        waiting_time = request.data.get('waiting_time', 0)
        trip_type = request.data.get('trip_type', 'one_way')
        
        is_daily_package = (trip_type == 'daily')
        is_pickup_drop = (trip_type == 'round_trip' or trip_type == 'daily')
        
        fare_details = calculate_ride_fare(
            distance_km=distance,
            is_pickup_drop=is_pickup_drop,
            is_daily_package=is_daily_package,
            waiting_time_minutes=waiting_time,
            vehicle_type=vehicle_type,
            cargo_capacity=request.data.get('cargo_capacity'),
            load_type=request.data.get('load_type'),
            is_own_vehicle=request.data.get('is_own_vehicle', False),
            surge_percent=request.data.get('surge_percent')
        )
        return Response(fare_details)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        role = 'driver' if hasattr(user, 'driver') else 'customer'
        
        profile = getattr(user, role, None)
        if not profile:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
            
        data = {
            "full_name": profile.full_name or f"{user.first_name} {user.last_name}".strip() or user.username,
            "email": user.email,
            "phone": profile.phone or "—",
            "role": role,
            "profile_image": request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None,
            "address": getattr(profile, 'address', '') if role == 'driver' else '',
            "vehicle_type": getattr(profile, 'vehicle_type', '') if role == 'driver' else '',
            "vehicle_number": getattr(profile, 'vehicle_number', '') if role == 'driver' else '',
            "vehicle_model": getattr(profile, 'vehicle_model', '') if role == 'driver' else '',
            "vehicles": [] # List of all registered vehicles
        }
        
        if role == 'driver':
            from .serializers import UserVehicleSerializer
            vehicles = UserVehicle.objects.filter(user=user)
            data["vehicles"] = UserVehicleSerializer(vehicles, many=True).data
            
        return Response(data)

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def patch(self, request):
        user = request.user
        role = 'driver' if hasattr(user, 'driver') else 'customer'
        profile = getattr(user, role, None)
        
        if not profile:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

        full_name = request.data.get('full_name')
        phone = request.data.get('phone')
        address = request.data.get('address')
        profile_picture = request.FILES.get('profile_picture')

        if full_name:
            profile.full_name = full_name
            # Also update auth user first/last names
            user.first_name = full_name.split()[0]
            user.last_name = ' '.join(full_name.split()[1:]) if len(full_name.split()) > 1 else ''
            user.save()
            
        if phone:
            profile.phone = phone
            
        if address and role == 'driver':
            profile.address = address
            
        if profile_picture:
            profile.profile_picture = profile_picture
            
        profile.save()

        return Response({
            "message": "Profile updated successfully",
            "full_name": profile.full_name,
            "email": user.email,
            "phone": profile.phone,
            "profile_image": request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None,
            "address": getattr(profile, 'address', '') if role == 'driver' else ''
        })

class LicenseUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        try:
            # Get or create driver profile for the user
            try:
                driver = request.user.driver
            except Driver.DoesNotExist:
                driver = Driver.objects.create(user=request.user)
            
            # Unique License Check
            license_number = request.data.get('license_number')
            if license_number and Driver.objects.filter(license_number=license_number).exclude(id=driver.id).exists():
                return Response({"error": "Invalid license number (already exists)"}, status=status.HTTP_400_BAD_REQUEST)

            # Update fields
            driver.license_number = license_number if license_number else driver.license_number
            driver.license_type = request.data.get('license_type', driver.license_type)
            driver.vehicle_type = request.data.get('vehicle_type', driver.vehicle_type)
            
            dob = request.data.get('date_of_birth')
            if dob: driver.date_of_birth = dob
            
            # Save vehicle details
            driver.vehicle_number = request.data.get('vehicle_number', driver.vehicle_number)
            driver.vehicle_model = request.data.get('vehicle_model', driver.vehicle_model)
            
            expiry = request.data.get('license_expiry')
            if expiry: driver.license_expiry = expiry

            if 'license_image' in request.FILES:
                driver.license_image = request.FILES['license_image']
            if 'license_image_back' in request.FILES:
                driver.license_image_back = request.FILES['license_image_back']
            if 'profile_picture' in request.FILES:
                driver.profile_picture = request.FILES['profile_picture']

            driver.verification_status = 'pending'
            driver.submission_date = timezone.now()
            driver.save()
            return Response({"message": "Verification documents uploaded successfully!"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DriverVerificationStatusView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            driver = request.user.driver
            return Response({
                "id": driver.id,
                "verification_status": driver.verification_status,
                "full_name": driver.full_name,
                "license_number": driver.license_number,
                "vehicle_type": driver.vehicle_type,
                "is_online": driver.is_online,
                "has_license_image": bool(driver.license_image),
                "has_license_image_back": bool(driver.license_image_back),
                "date_of_birth": driver.date_of_birth,
                "license_expiry": driver.license_expiry,
                "license_type": driver.license_type,
                "is_bank_details_added": driver.is_bank_details_added,
                "masked_account_number": driver.masked_account_number
            })
        except Driver.DoesNotExist:
            return Response({
                "id": None,
                "verification_status": "unverified",
                "full_name": "",
                "license_number": "",
                "vehicle_type": "",
                "is_online": False
            })

class DriverStatusToggleView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            driver = request.user.driver
        except Driver.DoesNotExist:
            return Response({"error": "Driver profile not found"}, status=404)
        
        is_online = request.data.get('is_online', False)
        
        # Validation before going online
        if is_online:
            # 1. Check Profile Completeness
            full_name = driver.full_name or f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
            if not full_name or not driver.address:
                return Response({
                    "error": "Please complete your profile details (Name and Address) before going online."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 2. Check License Verification
            if not driver.license_number:
                 return Response({"error": "Missing license number. Please update your documents."}, status=status.HTTP_400_BAD_REQUEST)

            # 3. Check Verification Status
            if driver.verification_status != 'verified':
                msg = "Your documents are under verification. Please wait for admin approval."
                if driver.verification_status == 'unverified':
                    msg = "Please submit your documents for verification."
                elif driver.verification_status == 'rejected':
                    msg = "Your verification was rejected. Please re-submit correct details."
                
                return Response({"error": msg}, status=status.HTTP_400_BAD_REQUEST)

            # Check if any vehicle exists
            if not driver.vehicle_number and not request.user.vehicles.exists():
                return Response({"error": "No registered vehicle found. Please add a vehicle before going online."}, status=status.HTTP_400_BAD_REQUEST)

            # Check Bank Details (Requirement 5)
            if not driver.is_bank_details_added:
                return Response({
                    "error": "Please add bank details to receive payments before going online",
                    "code": "BANK_DETAILS_MISSING"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check Commission Limit (Requirement 6)
            from .models import PlatformSettings
            settings_obj = PlatformSettings.objects.first()
            limit = settings_obj.commission_limit if settings_obj else 500.00
            if driver.total_commission_pending >= limit:
                return Response({
                    "error": f"Commission limit exceeded (₹{driver.total_commission_pending}). Please settle pending commission to go online.",
                    "code": "COMMISSION_LIMIT_EXCEEDED"
                }, status=status.HTTP_400_BAD_REQUEST)

            driver.last_active = timezone.now()
        
        driver.is_online = is_online
        driver.save()
        return Response({"is_online": driver.is_online, "last_active": driver.last_active})

class ActiveDriversListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        drivers = Driver.objects.filter(is_online=True)
        return Response([{"name": d.user.first_name, "email": d.user.email} for d in drivers])

class DriverDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        driver = request.user.driver
        # Filtering by period (daily, weekly, monthly)
        period = request.query_params.get('period', 'all')
        now = timezone.now()
        
        rides_query = Ride.objects.filter(driver=driver, status='paid')
        
        if period == 'daily':
            rides_query = rides_query.filter(updated_at__date=now.date())
        elif period == 'weekly':
            rides_query = rides_query.filter(updated_at__gte=now - timedelta(days=7))
        elif period == 'monthly':
            rides_query = rides_query.filter(updated_at__gte=now - timedelta(days=30))
            
        completed_rides = rides_query
        
        gross_earnings = sum(float(r.total_fare or 0) for r in completed_rides)
        total_commission = sum(float(r.commission_amount or 0) for r in completed_rides)
        net_earnings = sum(float(r.driver_amount or 0) for r in completed_rides)
        
        active_ride = Ride.objects.filter(driver=driver, status__in=['accepted', 'ongoing', 'completed']).first()
        recent_rides = Ride.objects.filter(driver=driver).order_by('-created_at')[:5]
        
        return Response({
            "total_trips": completed_rides.count(),
            "total_earnings": gross_earnings, # Gross for backward compatibility
            "gross_earnings": gross_earnings,
            "total_commission": total_commission,
            "net_earnings": net_earnings,
            "driver_id": driver.id,
            "upi_id": driver.upi_id,
            "user_id": request.user.id,
            "active_ride": RideSerializer(active_ride, context={'request': request}).data if active_ride else None,
            "recent_rides": [
                {
                    "id": r.id,
                    "drop": r.destination,
                    "amount": float(r.total_fare if r.status in ['completed', 'paid'] else r.estimated_fare),
                    "status": r.status,
                    "time": r.created_at,
                    "vehicle_type": r.vehicle_type
                } for r in recent_rides
            ]
        })

class AdminVerificationRequestsView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        drivers = Driver.objects.filter(verification_status__in=['pending', 'verified', 'rejected']).order_by('-submission_date')
        data = []
        for d in drivers:
            data.append({
                "id": d.id,
                "name": d.full_name,
                "email": d.user.email,
                "dl_number": d.license_number,
                "expiry_date": d.license_expiry,
                "vehicle_type": d.vehicle_type,
                "license_type": d.license_type,
                "front_image": request.build_absolute_uri(d.license_image.url) if d.license_image else None,
                "back_image": request.build_absolute_uri(d.license_image_back.url) if d.license_image_back else None,
                "verification_status": d.verification_status
            })
        return Response(data)

class AdminActionVerificationView(APIView):
    permission_classes = [IsAdminUser]
    def post(self, request):
        try:
            driver_id = request.data.get('driver_id')
            action = request.data.get('action')
            driver = Driver.objects.get(id=driver_id)
            driver.verification_status = 'verified' if action == 'approve' else 'rejected'
            driver.save()
            return Response({"message": f"Driver {action}d successfully"})
        except Driver.DoesNotExist:
            return Response({"error": "Driver not found"}, status=404)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)

class ForgotPasswordView(APIView):
    def post(self, request):
        email = request.data.get('email')
        if not email: return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(username=email)
            otp = str(random.randint(100000, 999999))
            EmailOTP.objects.update_or_create(email=user.email, defaults={'otp': otp})
            try:
                send_mail(
                    'RideConnect - Password Reset OTP',
                    f'Your password reset code is: {otp}',
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
            except Exception as e:
                import traceback
                print(f"FAILED TO SEND RESET OTP: {str(e)}")
                traceback.print_exc()
            return Response({"message": "OTP sent successfully"})
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)

class ResetPasswordView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp')
        new_password = request.data.get('new_password')
        if not all([email, otp_code, new_password]):
            return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            otp_obj = EmailOTP.objects.get(email=email, otp=otp_code)
            user = User.objects.get(username=email)
            user.set_password(new_password)
            user.save()
            otp_obj.delete()
            return Response({"message": "Password reset successfully!"})
        except (EmailOTP.DoesNotExist, User.DoesNotExist):
            return Response({"error": "Invalid OTP or Email"}, status=status.HTTP_400_BAD_REQUEST)

class CarBrandListView(APIView):
    def get(self, request):
        brands = CarBrand.objects.all()
        serializer = CarBrandSerializer(brands, many=True)
        return Response(serializer.data)

class CarModelListView(APIView):
    def get(self, request):
        brand_id = request.query_params.get('brand_id')
        if brand_id:
            models = CarModel.objects.filter(brand_id=brand_id)
        else:
            models = CarModel.objects.all()
        serializer = CarModelSerializer(models, many=True)
        return Response(serializer.data)

class UserVehicleListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            user = request.user
            vehicles = UserVehicle.objects.filter(user=user)
            serializer = UserVehicleSerializer(vehicles, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            user = request.user
            
            # Unique Vehicle Number Check (Normalized)
            registration_number = request.data.get('registration_number', '').strip().upper().replace(' ', '')
            existing_vehicle = UserVehicle.objects.filter(registration_number=registration_number).first()
            
            if existing_vehicle:
                if existing_vehicle.user != user:
                    return Response({"registration_number": [f"This vehicle (No. {registration_number}) is already registered to another account."]}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    # If same user, update existing one instead of creating duplicate
                    serializer = UserVehicleSerializer(existing_vehicle, data=request.data, partial=True)
            else:
                serializer = UserVehicleSerializer(data=request.data)

            if serializer.is_valid():
                vehicle = serializer.save(user=user)
                # Handle images if provided (multiple)
                images = request.FILES.getlist('images')
                for img in images:
                    UserVehicleImage.objects.create(vehicle=vehicle, image=img)
                
                return Response(UserVehicleSerializer(vehicle).data, status=status.HTTP_201_CREATED if not existing_vehicle else status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print("--- VEHICLE REGISTRATION ERROR ---")
            traceback.print_exc()
            return Response({"error": str(e), "registration_number": [f"Server error: {str(e)}"]}, status=status.HTTP_400_BAD_REQUEST)

class UserVehicleDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get_object(self, pk):
        try:
            return UserVehicle.objects.get(pk=pk)
        except UserVehicle.DoesNotExist:
            return None

    def patch(self, request, pk):
        vehicle = self.get_object(pk)
        if not vehicle:
            return Response({"error": "Vehicle not found"}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = UserVehicleSerializer(vehicle, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            images = request.FILES.getlist('images')
            for img in images:
                UserVehicleImage.objects.create(vehicle=vehicle, image=img)
            return Response(UserVehicleSerializer(vehicle).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        vehicle = self.get_object(pk)
        if not vehicle:
            return Response({"error": "Vehicle not found"}, status=status.HTTP_404_NOT_FOUND)
        vehicle.delete()
        return Response({"message": "Vehicle deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

class UserVehicleImageDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, pk):
        try:
            image = UserVehicleImage.objects.get(pk=pk)
            image.delete()
            return Response({"message": "Image deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except UserVehicleImage.DoesNotExist:
            return Response({"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND)

class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        email = request.query_params.get('email')
        try:
            user = User.objects.get(username=email)
            total_rides = Ride.objects.filter(customer__user=user, status='completed').count()
            return Response({"total_rides": total_rides})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class ActiveBookingView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        
        # 1. Driver Flow: If user is an online driver, return all searching rides
        try:
            if hasattr(user, 'driver') and user.driver.is_online:
                driver = user.driver
                rides = Ride.objects.filter(
                    status='searching', 
                    vehicle_type=driver.vehicle_type
                ).order_by('-created_at')
                return Response(RideSerializer(rides, many=True).data)
        except Exception as e:
            return Response({"error": f"Driver check failed: {str(e)}"}, status=500)

        # 2. Customer Flow: Return their current active ride
        email = request.query_params.get('email') or user.username
        try:
            ride = Ride.objects.filter(
                customer__user__username=email, 
                status__in=['searching', 'accepted', 'ongoing', 'completed']
            ).order_by('-created_at').first()
            
            if ride:
                return Response(RideSerializer(ride).data)
            return Response({"message": "No active booking"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RideStatusView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, ride_id):
        try:
            ride = Ride.objects.get(id=ride_id)
            serializer = RideStatusSerializer(ride, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Ride.DoesNotExist:
            return Response({"error": "Ride not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserPreferenceView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        pref, created = UserPreference.objects.get_or_create(user=request.user)
        return Response(UserPreferenceSerializer(pref).data)

    def post(self, request):
        pref, created = UserPreference.objects.get_or_create(user=request.user)
        serializer = UserPreferenceSerializer(pref, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfilePictureUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user = request.user
        role = 'driver' if hasattr(user, 'driver') else 'customer'
        profile = getattr(user, role, None)
        
        if not profile:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

        if 'profile_picture' in request.FILES:
            profile.profile_picture = request.FILES['profile_picture']
            profile.save()
            image_url = request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None
            return Response({
                "message": "Profile picture updated successfully",
                "profile_image": image_url
            })
        return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

class ProfilePictureDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request):
        user = request.user
        role = 'driver' if hasattr(user, 'driver') else 'customer'
        profile = getattr(user, role, None)
        
        if profile and profile.profile_picture:
            profile.profile_picture.delete()
            profile.save()
            return Response({"message": "Profile picture deleted successfully"})
        return Response({"error": "No profile picture to delete"}, status=status.HTTP_400_BAD_REQUEST)

class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        from .models import Driver, Customer, Ride
        from django.db.models import Sum
        
        try:
            total_customers = Customer.objects.count()
            total_drivers = Driver.objects.count()
            active_drivers = Driver.objects.filter(is_online=True).count()
            ongoing_rides = Ride.objects.filter(status='ongoing').count()
            completed_rides = Ride.objects.filter(status='completed').count()
            
            drivers_qs = Driver.objects.all()
            earned_agg = drivers_qs.aggregate(Sum('total_commission_paid'))
            pending_agg = drivers_qs.aggregate(Sum('total_commission_pending'))
            
            total_earned = earned_agg.get('total_commission_paid__sum') or 0
            total_pending = pending_agg.get('total_commission_pending__sum') or 0

            return Response({
                "total_users": total_customers,
                "total_drivers": total_drivers,
                "active_drivers": active_drivers,
                "ongoing_rides": ongoing_rides,
                "completed_rides": completed_rides,
                "total_commission_earned": float(total_earned),
                "total_commission_pending": float(total_pending),
                "platform_revenue": float(total_earned),
                "platform_commission": float(total_earned)
            })
        except Exception as e:
            import traceback
            print(f"--- ADMIN DASHBOARD STATS EXCEPTION ---\n{traceback.format_exc()}")
            return Response({"error": str(e)}, status=500)

class AdminUserManagementView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        role_filter = request.query_params.get('role', 'all')
        users_list = []
        
        # Simple fetch of all app users
        users = User.objects.all().order_by('-date_joined')
        
        for user in users:
            role = 'Customer'
            status = 'Offline'
            is_active = user.is_active
            
            # Check if driver
            driver_profile = getattr(user, 'driver', None)
            customer_profile = getattr(user, 'customer', None)
            
            if driver_profile:
                role = 'Driver'
                status = 'Online' if driver_profile.is_online else 'Offline'
                if role_filter == 'customer': continue
            elif customer_profile:
                role = 'Customer'
                status = 'Online' if customer_profile.is_online else 'Offline'
                if role_filter == 'driver': continue
            else:
                # Likely admin or base user
                if role_filter != 'all': continue
                role = 'Admin' if user.is_staff else 'User'

            users_list.append({
                "id": user.id,
                "name": f"{user.first_name} {user.last_name}".strip() or user.username,
                "email": user.email,
                "phone": getattr(driver_profile or customer_profile, 'phone', '—'),
                "role": role,
                "status": status,
                "is_active": is_active
            })
            
        return Response(users_list)

    def post(self, request):
        # Toggle block status
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(id=user_id)
            user.is_active = not user.is_active
            user.save()
            status_text = "unblocked" if user.is_active else "blocked"
            return Response({"message": f"User successfully {status_text}"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

    def delete(self, request):
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(id=user_id)
            user.delete()
            return Response({"message": "User permanently deleted"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

class AdminBookingView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        rides = Ride.objects.all().order_by('-created_at')
        from .serializers import RideSerializer
        return Response(RideSerializer(rides, many=True).data)

class RideVerifyOTPView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, ride_id):
        ride = Ride.objects.get(id=ride_id)
        if ride.otp == request.data.get('otp'):
            ride.status = 'ongoing'
            ride.save()
            return Response(RideStatusSerializer(ride).data)
        return Response({"error": "Invalid OTP"}, status=400)

class RideEndView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, ride_id):
        try:
            ride = Ride.objects.get(id=ride_id)
            
            # Get final distance and waiting time from request or use current values
            final_distance = float(request.data.get('distance', ride.distance))
            waiting_time = int(request.data.get('waiting_time', ride.waiting_time or 0))
            
            # Re-calculate final fare based on actuals (preserving vehicle_type and cargo details)
            fare_details = calculate_ride_fare(
                distance_km=final_distance,
                is_pickup_drop=ride.is_pickup_drop,
                is_daily_package=ride.is_daily_package,
                waiting_time_minutes=waiting_time,
                vehicle_type=ride.vehicle_type or 'car',
                cargo_capacity=ride.cargo_capacity,
                load_type=ride.load_type,
                is_own_vehicle=getattr(ride, 'is_own_vehicle', False),
                surge_percent=float(ride.surge_amount / ride.estimated_fare) if ride.surge_amount and ride.estimated_fare else None
            )
            
            ride.status = 'completed'
            ride.payment_status = 'PENDING'
            ride.distance = final_distance
            ride.waiting_time = waiting_time
            ride.total_fare = Decimal(str(fare_details['total_fare']))
            ride.estimated_fare = ride.total_fare # Keep for compatibility

            # Calculate Commission (8%)
            try:
                from .models import PlatformSettings
                settings = PlatformSettings.objects.first()
                comm_pct = Decimal(str(settings.commission_percentage if settings else 8.0))
            except Exception:
                comm_pct = Decimal("8.0")
            
            ride.commission_amount = (ride.total_fare * comm_pct / Decimal("100.0")).quantize(Decimal("0.01"))
            ride.driver_amount = (ride.total_fare - ride.commission_amount).quantize(Decimal("0.01"))
            
            ride.save()
            
            # Notify Customer via WebSocket
            channel_layer = get_channel_layer()
            notification_data = {
                'type': 'ride_update',
                'ride_status': 'completed',
                'ride_id': ride.id,
                'amount': float(ride.total_fare or 0),
                'paymentStatus': 'PENDING',
                'ride_data': RideSerializer(ride, context={'request': request}).data
            }
            
            # Send to both 'ride_completed' and regular update handlers if client expects either
            # We'll stick to 'ride_update' as the main type but ensure rideId and amount are top-level
            
            # Notify by numeric ID
            async_to_sync(channel_layer.group_send)(
                sanitize_group_name(f'user_{ride.customer.user.id}'),
                notification_data
            )
            
            # Notify by Email (Username)
            async_to_sync(channel_layer.group_send)(
                sanitize_group_name(f'user_{ride.customer.user.username}'),
                notification_data
            )
            
            return Response({
                "status": "completed",
                "total_fare": ride.total_fare,
                "waiting_charge": fare_details['waiting_charge']
            }, status=status.HTTP_200_OK)
        except Ride.DoesNotExist:
            return Response({"error": "Ride not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ApplySurgeView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, ride_id):
        try:
            ride = Ride.objects.get(id=ride_id)
            surge_amount = Decimal(str(request.data.get('surge_amount', 0)))
            
            # Update ride fare with surge
            ride.surge_amount = surge_amount
            ride.total_fare = ride.base_fare + ride.extra_charge + ride.waiting_charge + ride.return_fare + surge_amount
            ride.estimated_fare = ride.total_fare
            ride.status = 'searching'
            ride.save()
            
            # Retry matching with expanded radius (30 KM)
            online_drivers = Driver.objects.filter(
                is_online=True, 
                verification_status='verified',
                vehicle_type=ride.vehicle_type
            )
            
            nearby_drivers = []
            for driver in online_drivers:
                if driver.current_lat is None or driver.current_lng is None:
                    continue

                dist = haversine_distance(
                    ride.pickup_lat, ride.pickup_lng, 
                    driver.current_lat, driver.current_lng
                )
                # Expanded radius after surge
                if dist <= 30.0:
                    nearby_drivers.append(driver)
            
            channel_layer = get_channel_layer()
            ride_data = RidePublicSerializer(ride).data
            
            for driver in nearby_drivers:
                async_to_sync(channel_layer.group_send)(
                    sanitize_group_name(f'driver_{driver.id}'),
                    {
                        "type": "send_ride_request",
                        "data": {
                            "pickup": ride.pickup_location,
                            "destination": ride.destination,
                            "fare": str(ride.total_fare),
                            "ride_id": ride.id
                        }
                    }
                )
            
            return Response({
                "message": "Surge applied and matching retried",
                "total_fare": float(ride.total_fare),
                "drivers_notified": len(nearby_drivers)
            }, status=status.HTTP_200_OK)
        except Ride.DoesNotExist:
            return Response({"error": "Ride not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DriverLocationUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            driver = request.user.driver
            lat = request.data.get('lat')
            lng = request.data.get('lng')
            if lat is not None and lng is not None:
                driver.current_lat = float(lat)
                driver.current_lng = float(lng)
                driver.save()
                return Response({"message": "Location updated"})
            return Response({"error": "Invalid coordinates"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class RidePayView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, ride_id):
        try:
            ride = Ride.objects.get(id=ride_id)
            ride.status = 'paid'
            ride.payment_status = 'SUCCESS'
            ride.save()
            
            # Update driver wallet (Customer paid driver directly)
            if ride.driver:
                ride.driver.total_earnings = Decimal(str(ride.driver.total_earnings)) + Decimal(str(ride.total_fare))
                ride.driver.total_commission_pending = Decimal(str(ride.driver.total_commission_pending)) + Decimal(str(ride.commission_amount))
                ride.driver.save()
                
                # Notify driver via User ID group
                channel_layer = get_channel_layer()
                if channel_layer:
                    notification_data = {
                        'type': 'ride_update',
                        'ride_status': 'paid',
                        'paymentStatus': 'SUCCESS',
                        'ride_id': ride.id,
                        'amount': float(ride.total_fare)
                    }
                    # Driver Notification
                    async_to_sync(channel_layer.group_send)(
                        sanitize_group_name(f'driver_{ride.driver.id}'),
                        notification_data
                    )
                    # Customer Notification (ID & Email)
                    async_to_sync(channel_layer.group_send)(
                        sanitize_group_name(f'user_{ride.customer.user.id}'),
                        notification_data
                    )
                    async_to_sync(channel_layer.group_send)(
                        sanitize_group_name(f'user_{ride.customer.user.username}'),
                        notification_data
                    )
            
            return Response({"status": "paid", "message": "Payment successful"})
        except Ride.DoesNotExist:
            return Response({"error": "Ride not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class UpdateDriverUPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            driver = request.user.driver
            upi_id = request.data.get('upi_id')
            if upi_id:
                driver.upi_id = upi_id
                driver.save()
                return Response({"message": "UPI ID updated", "upi_id": upi_id})
            return Response({"error": "UPI ID is required"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class DriverProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            driver = request.user.driver
            serializer = DriverFullSerializer(driver, context={'request': request})
            return Response(serializer.data)
        except Driver.DoesNotExist:
            return Response({"error": "Driver profile not found"}, status=404)
            
    def post(self, request):
        try:
            driver = request.user.driver
            serializer = DriverFullSerializer(driver, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except Driver.DoesNotExist:
            return Response({"error": "Driver profile not found"}, status=404)

class PlatformSettingsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            from .models import PlatformSettings
            settings, created = PlatformSettings.objects.get_or_create(id=1)
            return Response({
                "account_holder": settings.account_holder_name,
                "account_number": settings.bank_account_number,
                "ifsc": settings.bank_ifsc_code,
                "upi_id": settings.upi_id,
                "commission_percent": float(settings.commission_percentage)
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        try:
            from .models import PlatformSettings
            settings, created = PlatformSettings.objects.get_or_create(id=1)
            data = request.data or {}
            settings.account_holder_name = data.get('account_holder', settings.account_holder_name)
            settings.bank_account_number = data.get('account_number', settings.bank_account_number)
            settings.bank_ifsc_code = data.get('ifsc', settings.bank_ifsc_code)
            settings.upi_id = data.get('upi_id', settings.upi_id)
            
            settings.commission_percentage = float(data.get('commission_percent', settings.commission_percentage))
            settings.commission_limit = float(data.get('commission_limit', settings.commission_limit))
            
            settings.save()
            return Response({"message": "Platform settings updated"})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

class CommissionTrackingView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        rides = Ride.objects.filter(status='paid').order_by('-updated_at')
        from .serializers import RideSerializer
        return Response(RideSerializer(rides, many=True, context={'request': request}).data)

class DriverWalletView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            from .models import Driver, PlatformSettings
            driver = Driver.objects.get(user=request.user)
            settings_obj = PlatformSettings.objects.first()
            limit = float(settings_obj.commission_limit) if settings_obj else 500.00
            
            return Response({
                "total_earnings": float(driver.total_earnings),
                "pending_commission": float(driver.total_commission_pending),
                "total_paid": float(driver.total_commission_paid),
                "limit": limit,
                "is_restricted": float(driver.total_commission_pending) >= limit,
                "admin_bank_details": {
                    "account_holder": settings_obj.account_holder_name if settings_obj else "",
                    "account_number": settings_obj.bank_account_number if settings_obj else "",
                    "ifsc": settings_obj.bank_ifsc_code if settings_obj else "",
                    "upi_id": settings_obj.upi_id if settings_obj else ""
                },
                "payment_history": [
                    {
                        "id": p.id,
                        "amount": float(p.amount),
                        "date": p.created_at,
                        "status": p.status
                    } for p in driver.commission_payments.all().order_by('-created_at')[:10]
                ]
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class MarkCommissionAsPaidView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            driver = request.user.driver
            amount = Decimal(str(request.data.get('amount', 0)))
            if amount <= 0:
                return Response({"error": "Invalid amount"}, status=400)
            
            if amount > driver.total_commission_pending:
                return Response({"error": "Amount exceeds pending commission"}, status=400)

            # In a real system, we'd wait for admin approval. 
            # But the requirement says "Mark as Paid" button -> reduce pending commission.
            # We'll stick to a simple immediate update for now as a "fully internal tracking system".
            from .models import CommissionPayment
            CommissionPayment.objects.create(
                driver=driver,
                amount=amount,
                status='approved' # Auto-approved for this simulation/internal tracking
            )
            
            driver.total_commission_pending -= amount
            driver.total_commission_paid += amount
            driver.save()
            
            return Response({
                "message": "Payment recorded successfully",
                "pending_commission": float(driver.total_commission_pending)
            })
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class AdminDriverCommissionListView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        from .models import Driver
        drivers = Driver.objects.exclude(total_commission_pending=0).order_by('-total_commission_pending')
        data = [{
            "id": d.id,
            "name": d.full_name or d.user.username,
            "email": d.user.email,
            "pending_commission": float(d.total_commission_pending),
            "total_earned": float(d.total_earnings),
            "total_paid": float(d.total_commission_paid)
        } for d in drivers]
        return Response(data)

class SettleCommissionView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            from decimal import Decimal
            from .models import Driver, CommissionPayment
            driver = Driver.objects.get(user=request.user)
            amount = Decimal(str(request.data.get('amount', driver.total_commission_pending)))
            if amount <= 0:
                return Response({"error": "Invalid amount"}, status=400)
            
            with transaction.atomic():
                if amount > driver.total_commission_pending:
                    amount = driver.total_commission_pending
                
                driver.total_commission_pending -= amount
                driver.total_commission_paid += amount
                driver.save()
                
                CommissionPayment.objects.create(
                    driver=driver,
                    amount=amount,
                    transaction_id=request.data.get('transaction_id', 'MANUAL'),
                    status='approved'
                )
            
            return Response({"message": "Commission settled successfully", "new_pending": float(driver.total_commission_pending)})
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class CommissionTrackingView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        from .models import Ride
        # Get all completed rides to show commission history
        rides = Ride.objects.filter(status='completed').order_by('-created_at')
        
        data = [{
            "id": r.id,
            "created_at": r.created_at,
            "driver_name": r.driver.user.get_full_name() or r.driver.user.username if r.driver else "Unassigned",
            "customer_name": r.customer.user.get_full_name() or r.customer.user.username if r.customer else "Guest",
            "total_fare": float(r.estimated_fare),
            "commission_amount": float(r.commission_amount),
            "driver_amount": float(r.driver_amount),
            "paymentStatus": "Paid" # Since it's completed and tracked internal
        } for r in rides]
        
        return Response(data)

class RidePaymentMethodView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            ride_id = request.data.get('ride_id')
            method = request.data.get('method')
            ride = Ride.objects.get(id=ride_id)
            ride.payment_method = method
            ride.payment_status = 'pending'
            ride.save()
            
            channel_layer = get_channel_layer()
            if channel_layer:
                from .serializers import RideStatusSerializer
                notification_data = {
                    'type': 'ride_update',
                    'ride_status': ride.status,
                    'payment_method': method,
                    'paymentStatus': 'pending',
                    'ride_data': RideStatusSerializer(ride).data,
                    'ride_id': ride.id
                }
                if ride.driver:
                    async_to_sync(channel_layer.group_send)(
                        sanitize_group_name(f'driver_{ride.driver.id}'), notification_data
                    )
                if ride.customer:
                    async_to_sync(channel_layer.group_send)(
                        sanitize_group_name(f'user_{ride.customer.user.id}'), notification_data
                    )
                    async_to_sync(channel_layer.group_send)(
                        sanitize_group_name(f'user_{ride.customer.user.username}'), notification_data
                    )
            
            return Response({"message": "Payment method updated", "method": method})
        except Ride.DoesNotExist:
            return Response({"error": "Ride not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class RidePaymentCompleteView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            ride_id = request.data.get('ride_id')
            ride = Ride.objects.get(id=ride_id)
            ride.status = 'paid'
            ride.payment_status = 'completed'
            ride.save()
            
            # Update driver wallet
            if ride.driver:
                ride.driver.total_earnings = Decimal(str(ride.driver.total_earnings)) + Decimal(str(ride.total_fare))
                ride.driver.total_commission_pending = Decimal(str(ride.driver.total_commission_pending)) + Decimal(str(ride.commission_amount))
                ride.driver.save()
                
                channel_layer = get_channel_layer()
                if channel_layer:
                    notification_data = {
                        'type': 'ride_update',
                        'ride_status': 'paid',
                        'paymentStatus': 'completed',
                        'payment_method': ride.payment_method,
                        'ride_id': ride.id,
                        'amount': float(ride.total_fare)
                    }
                    async_to_sync(channel_layer.group_send)(sanitize_group_name(f'driver_{ride.driver.id}'), notification_data)
                    async_to_sync(channel_layer.group_send)(sanitize_group_name(f'user_{ride.customer.user.id}'), notification_data)
                    async_to_sync(channel_layer.group_send)(sanitize_group_name(f'user_{ride.customer.user.username}'), notification_data)
            
            return Response({"status": "paid", "message": "Payment successful"})
        except Ride.DoesNotExist:
            return Response({"error": "Ride not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
