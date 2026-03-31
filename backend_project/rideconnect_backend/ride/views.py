import re
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
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.conf import settings
from django.db.models import Sum
import googlemaps

from .models import EmailOTP, Customer, Driver, CarBrand, CarModel, UserVehicle, UserVehicleImage, Ride, UserPreference
from .serializers import (
    UserSerializer, CarBrandSerializer, CarModelSerializer, 
    UserVehicleSerializer, RideSerializer, RidePublicSerializer,
    UserBriefSerializer, DriverBriefSerializer, UserPreferenceSerializer, RideStatusSerializer
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated

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

def calculate_ride_fare(distance_km, is_pickup_drop=False, is_daily_package=False, waiting_time_minutes=0, vehicle_type='car'):
    """
    New Pricing Logic:
    1. Daily Package (Pickup + Drop Only):
       - Fixed ₹1000 for 12 hours / 150 km
       - Extra km > 150 @ ₹3/km
       - Waiting charge @ ₹35/hour
    2. Standard Pricing:
       - Onward: First 40 km @ ₹600, After 40 km @ ₹3/km
       - Return (if Round Trip): Entire return distance @ ₹3/km
       - Waiting charge @ ₹35/hour (only for Round Trip / Pickup+Drop)
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

    if vehicle_type == 'bike':
        # Rapido-style Bike Pricing
        # 1. Base Fare: ₹22 for first 2 km
        base_fare = 22.0
        
        if onward_distance <= 2:
            onward_fare = base_fare
        elif onward_distance <= 6:
            # First 2km at 22, next 4km at 6/km
            extra_distance = onward_distance - 2.0
            extra_charge = extra_distance * 6.0
            onward_fare = base_fare + extra_charge
        else:
            # First 2km at 22, next 4km at 6/km, rest at 8/km
            extra_distance = onward_distance - 2.0
            # Charge for 2-6km range (4km * ₹6 = ₹24)
            range_2_6_charge = 4.0 * 6.0
            # Charge for >6km range
            range_over_6_dist = onward_distance - 6.0
            range_over_6_charge = range_over_6_dist * 8.0
            extra_charge = range_2_6_charge + range_over_6_charge
            onward_fare = base_fare + extra_charge
            
        # 2. Surcharge: ₹10 - ₹20
        surcharge = float(random.randint(10, 20))
        
        # 3. Waiting Charge: ₹1/min after 3 mins
        if waiting_time_minutes > 3:
            waiting_charge = (waiting_time_minutes - 3) * 1.0
            
        total_fare = onward_fare + surcharge + waiting_charge
        total_distance = onward_distance

    else:
        # Existing Car Pricing Logic
        waiting_charge = round((waiting_time_minutes / 60.0) * 35.0, 2)
        
        if is_daily_package:
            base_fare = 1000.0
            if onward_distance <= 150:
                extra_distance = 0.0
                extra_charge = 0.0
            else:
                extra_distance = onward_distance - 150.0
                extra_charge = extra_distance * 3.0
                
            onward_fare = base_fare + extra_charge
            return_distance = 0.0
            return_fare = 0.0
            total_fare = onward_fare + waiting_charge
            total_distance = onward_distance
        else:
            # Standard Pricing
            base_fare = 600.0
            if onward_distance <= 40:
                extra_distance = 0.0
                extra_charge = 0.0
            else:
                extra_distance = onward_distance - 40.0
                extra_charge = extra_distance * 3.0
                
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
        'return_fare': round(float(return_fare), 2 if vehicle_type != 'bike' else 0),
        'base_fare': round(float(base_fare), 2),
        'extra_distance': round(float(extra_distance), 2),
        'extra_charge': round(float(extra_charge), 2),
        'onward_distance': round(float(onward_distance), 2),
        'return_distance': round(float(return_distance if vehicle_type != 'bike' else 0.0), 2),
        'total_distance': round(float(total_distance), 2),
        'waiting_charge': round(float(waiting_charge), 2),
        'waiting_time': int(waiting_time_minutes),
        'surcharge_amount': round(float(surcharge), 2)
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
        
        # Mapping frontend names to backend if needed
        if 'destination' not in data and 'drop_location' in data:
            data['destination'] = data['drop_location']
        if 'estimated_fare' not in data and 'price' in data:
            data['estimated_fare'] = data['price']
        if 'vehicle_type' not in data and 'selected_vehicle_type' in data:
            data['vehicle_type'] = data['selected_vehicle_type']

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
        
        # Implement Backend Fare Calculation (Latest Logic)
        fare_details = calculate_ride_fare(
            distance_km=distance_val, 
            is_pickup_drop=is_pickup_drop,
            is_daily_package=is_daily_package,
            waiting_time_minutes=data.get('waiting_time', 0),
            vehicle_type=data.get('vehicle_type', 'car')
        )
        
        data['estimated_fare'] = fare_details['total_fare']
        data['total_fare'] = fare_details['total_fare']
        data['is_pickup_drop'] = is_pickup_drop
        data['is_daily_package'] = is_daily_package
        data['waiting_time'] = fare_details['waiting_time']
        data['waiting_charge'] = fare_details['waiting_charge']
        data['surge_amount'] = fare_details.get('surcharge_amount', 0.0)
        
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
                # Driver Radius Filtering (20 KM radius)
                online_drivers = Driver.objects.filter(
                    is_online=True, 
                    verification_status='verified',
                    vehicle_type=ride.vehicle_type
                )
                
                nearby_drivers = []
                for driver in online_drivers:
                    if driver.current_lat is None or driver.current_lng is None:
                        # Skip drivers with no location for now, or use a default
                        continue
                        
                    dist = haversine_distance(
                        ride.pickup_lat, ride.pickup_lng, 
                        driver.current_lat, driver.current_lng
                    )
                    if dist <= 20.0:
                        nearby_drivers.append(driver)
                
                # Notify only nearby drivers
                channel_layer = get_channel_layer()
                ride_data = RidePublicSerializer(ride).data
                
                for driver in nearby_drivers:
                    async_to_sync(channel_layer.group_send)(
                        f'driver_{driver.id}',
                        {
                            "type": "send_ride_request",
                            "data": {
                                "ride_id": ride.id,
                                "pickup_location": ride.pickup_location,
                                "destination": ride.destination,
                                "estimated_fare": str(ride.total_fare),
                                "vehicle_type": ride.vehicle_type,
                                "duration_text": ride.duration_text or "Calculating...",
                                "distance": ride.distance
                            }
                        }
                    )
                
                # Check if no drivers were found
                if not nearby_drivers:
                    # In a real app, we might handle this asynchronously
                    # For now, we'll let the frontend handle the timeout
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
        except Driver.DoesNotExist:
            return Response({"error": "Driver not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            with transaction.atomic():
                ride = Ride.objects.select_for_update().get(id=ride_id)
                if ride.status != 'searching':
                    return Response({"error": "Ride is no longer available"}, status=status.HTTP_400_BAD_REQUEST)
                
                ride.driver = driver
                # Assign driver's vehicle if available
                driver_vehicle = UserVehicle.objects.filter(user=driver.user).first()
                if driver_vehicle:
                    ride.vehicle = driver_vehicle
                ride.status = 'accepted'
                ride.save()
            
            channel_layer = get_channel_layer()
            
            # 1. Notify the User (Customer)
            async_to_sync(channel_layer.group_send)(
                f'user_{ride.customer.user.id}',
                {
                    'type': 'ride_update',
                    'ride_status': 'accepted',
                    'driver_data': RideSerializer(ride).data.get('driver'),
                    'ride_data': RideSerializer(ride).data
                }
            )
            
            # 2. Notify other drivers to remove it from their feed
            async_to_sync(channel_layer.group_send)(
                f'drivers_{ride.vehicle_type}',
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
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AvailableRidesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            driver = Driver.objects.get(user__username=email)
            
            # Get all potential candidate rides
            rides = Ride.objects.filter(
                status='searching', 
                vehicle_type=driver.vehicle_type
            ).order_by('-created_at')
            
            # Filter by radius if driver location is known
            filtered_rides = []
            if driver.current_lat is not None and driver.current_lng is not None:
                for ride in rides:
                    dist = haversine_distance(
                        ride.pickup_lat, ride.pickup_lng,
                        driver.current_lat, driver.current_lng
                    )
                    if dist <= 25.0: # Increased slightly from 20 to 25 for better polling catch
                        filtered_rides.append(ride)
            else:
                # If driver has no location yet, show most recent rides for their vehicle type
                # but limit to last 5 to keep the feed clean
                filtered_rides = list(rides[:5])
            
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
            vehicle_type=vehicle_type
        )
        return Response(fare_details)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        email = request.query_params.get('email')
        user = User.objects.get(username=email)
        role = 'driver' if hasattr(user, 'driver') else 'customer'
        phone = user.driver.phone if role == 'driver' else user.customer.phone
        return Response({"name": user.first_name, "email": user.email, "phone": phone, "role": role})

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=email)
            name = request.data.get('name')
            phone = request.data.get('phone')

            if name:
                user.first_name = name
                user.save()

            if phone:
                if hasattr(user, 'customer'):
                    user.customer.phone = phone
                    user.customer.save()
                elif hasattr(user, 'driver'):
                    user.driver.phone = phone
                    user.driver.save()
            
            # New field: address (Driver only)
            address = request.data.get('address')
            if address and hasattr(user, 'driver'):
                user.driver.address = address
                user.driver.save()

            # New field: full_name (Both)
            full_name = request.data.get('full_name') or name
            if full_name:
                if hasattr(user, 'customer'):
                    user.customer.full_name = full_name
                    user.customer.save()
                elif hasattr(user, 'driver'):
                    user.driver.full_name = full_name
                    user.driver.save()

            final_phone = ''
            if hasattr(user, 'customer'): final_phone = user.customer.phone
            elif hasattr(user, 'driver'): final_phone = user.driver.phone

            return Response({
                "message": "Profile updated successfully",
                "name": user.first_name,
                "email": user.email,
                "phone": final_phone
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class LicenseUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            # Get or create driver profile for the user
            try:
                driver = request.user.driver
            except Driver.DoesNotExist:
                driver = Driver.objects.create(user=request.user)
            
            # Update fields
            driver.license_number = request.data.get('license_number', driver.license_number)
            driver.license_type = request.data.get('license_type', driver.license_type)
            driver.vehicle_type = request.data.get('vehicle_type', driver.vehicle_type)
            
            dob = request.data.get('date_of_birth')
            if dob: driver.date_of_birth = dob
            
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
                "license_type": driver.license_type
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
            # 1. Check Personal & Address
            if not driver.full_name or not driver.address or not driver.phone:
                return Response({
                    "error": "Please complete your profile details (Name, Phone, and Address) before going online."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 2. Check License Documents
            if not driver.license_number or not driver.license_image or not driver.license_image_back:
                return Response({
                    "error": "Please upload all required documents (License Number, Front & Back images) before going online."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 3. Check Verification Status
            if driver.verification_status != 'verified':
                msg = "Your documents are under verification. Please wait for admin approval."
                if driver.verification_status == 'unverified':
                    msg = "Please submit your documents for verification."
                elif driver.verification_status == 'rejected':
                    msg = "Your verification was rejected. Please re-submit correct details."
                
                return Response({"error": msg}, status=status.HTTP_400_BAD_REQUEST)

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
        rides = Ride.objects.filter(driver=request.user.driver, status='completed')
        return Response({"total_trips": rides.count(), "total_earnings": sum(r.estimated_fare for r in rides)})

class AdminVerificationRequestsView(APIView):
    permission_classes = [IsAuthenticated]
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
    permission_classes = [IsAuthenticated]
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
            serializer = UserVehicleSerializer(data=request.data)
            if serializer.is_valid():
                vehicle = serializer.save(user=user)
                # Handle images if provided (multiple)
                images = request.FILES.getlist('images')
                for img in images:
                    UserVehicleImage.objects.create(vehicle=vehicle, image=img)
                
                return Response(UserVehicleSerializer(vehicle).data, status=status.HTTP_201_CREATED)
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
                status__in=['searching', 'accepted', 'ongoing']
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
            serializer = RideStatusSerializer(ride)
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
    def post(self, request): return Response({})

class ProfilePictureDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request): return Response({})

class AdminDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request): return Response({})

class AdminUserManagementView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request): return Response([])

class AdminBookingView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        rides = Ride.objects.all()
        return Response(RideSerializer(rides, many=True).data)

class RideVerifyOTPView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, ride_id):
        ride = Ride.objects.get(id=ride_id)
        if ride.otp == request.data.get('otp'):
            ride.status = 'ongoing'
            ride.save()
            return Response({"status": "ongoing"})
        return Response({"error": "Invalid OTP"}, status=400)

class RideEndView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, ride_id):
        try:
            ride = Ride.objects.get(id=ride_id)
            
            # Get final distance and waiting time from request or use current values
            final_distance = float(request.data.get('distance', ride.distance))
            waiting_time = int(request.data.get('waiting_time', ride.waiting_time or 0))
            
            # Re-calculate final fare based on actuals
            fare_details = calculate_ride_fare(
                distance_km=final_distance,
                is_pickup_drop=ride.is_pickup_drop,
                is_daily_package=ride.is_daily_package,
                waiting_time_minutes=waiting_time
            )
            
            ride.status = 'completed'
            ride.distance = final_distance
            ride.waiting_time = waiting_time
            ride.total_fare = fare_details['total_fare']
            ride.estimated_fare = fare_details['total_fare'] # Keep for compatibility
            ride.save()
            
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
                    f'driver_{driver.id}',
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
