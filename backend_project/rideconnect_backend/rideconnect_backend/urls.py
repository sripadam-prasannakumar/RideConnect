"""
URL configuration for rideconnect_backend project.
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from ride.views import (
    RegisterView, VerifyOTPView, HomeView, LoginView, ResendOTPView, LogoutView,
    UserProfileView, LicenseUploadView, DriverVerificationStatusView,
    AdminVerificationRequestsView, AdminActionVerificationView,
    ForgotPasswordView, ResetPasswordView, CarBrandListView, CarModelListView,
    UpdateProfileView, UserVehicleListView, UserVehicleDetailView, UserVehicleImageDeleteView,
    RideRequestView, RideAcceptView, RideHistoryView, AvailableRidesView, UserStatsView, ActiveBookingView,
    UserPreferenceView, ProfilePictureUploadView, ProfilePictureDeleteView,
    AdminDashboardStatsView, AdminUserManagementView, AdminBookingView,
    DriverStatusToggleView, ActiveDriversListView, DriverDashboardStatsView,
    RideVerifyOTPView, RideEndView, ApplySurgeView, DriverLocationUpdateView
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', HomeView.as_view(), name='home'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('api/verify-email/', VerifyOTPView.as_view(), name='verify_email'),  # alias
    path('api/resend-otp/', ResendOTPView.as_view(), name='resend_otp'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/user-profile/', UserProfileView.as_view(), name='user_profile'),
    path('api/driver/license/', LicenseUploadView.as_view(), name='license_upload'),
    path('api/driver/verification-status/', DriverVerificationStatusView.as_view(), name='driver_verification_status'),
    path('api/admin/verification-requests/', AdminVerificationRequestsView.as_view(), name='admin_verification_requests'),
    path('api/admin/verify-action/', AdminActionVerificationView.as_view(), name='admin_verify_action'),
    path('api/forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('api/reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('api/vehicles/brands/', CarBrandListView.as_view(), name='car_brands'),
    path('api/vehicles/models/', CarModelListView.as_view(), name='car_models'),
    path('api/update-profile/', UpdateProfileView.as_view(), name='update_profile'),
    path('api/user-vehicles/', UserVehicleListView.as_view(), name='user_vehicles_list_create'),
    path('api/user-vehicles/<int:pk>/', UserVehicleDetailView.as_view(), name='user_vehicle_detail'),
    path('api/user-vehicles/images/<int:pk>/', UserVehicleImageDeleteView.as_view(), name='user_vehicle_image_delete'),
    path('api/ride/request/', RideRequestView.as_view(), name='ride_request'),
    path('api/ride/accept/<int:ride_id>/', RideAcceptView.as_view(), name='ride_accept'),
    path('api/ride/history/', RideHistoryView.as_view(), name='ride_history'),
    path('api/ride/available/', AvailableRidesView.as_view(), name='available_rides'),
    path('api/user-stats/', UserStatsView.as_view(), name='user_stats'),
    path('api/ride/active/', ActiveBookingView.as_view(), name='active_booking'),
    path('api/user-preferences/', UserPreferenceView.as_view(), name='user_preferences'),
    path('api/profile-picture/upload/', ProfilePictureUploadView.as_view(), name='profile_picture_upload'),
    path('api/profile-picture/delete/', ProfilePictureDeleteView.as_view(), name='profile_picture_delete'),
    path('api/admin/stats/', AdminDashboardStatsView.as_view(), name='admin_stats'),
    path('api/admin/users/', AdminUserManagementView.as_view(), name='admin_users'),
    path('api/admin/bookings/', AdminBookingView.as_view(), name='admin_bookings'),
    path('api/driver/status-toggle/', DriverStatusToggleView.as_view(), name='driver_status_toggle'),
    path('api/admin/active-drivers/', ActiveDriversListView.as_view(), name='admin_active_drivers'),
    path('api/driver/dashboard-stats/', DriverDashboardStatsView.as_view(), name='driver_dashboard_stats'),
    path('api/ride/verify-otp/<int:ride_id>/', RideVerifyOTPView.as_view(), name='ride-verify-otp'),
    path('api/ride/end/<int:ride_id>/', RideEndView.as_view(), name='ride-end'),
    path('api/ride/apply-surge/<int:ride_id>/', ApplySurgeView.as_view(), name='apply_surge'),
    path('api/driver/update-location/', DriverLocationUpdateView.as_view(), name='driver_update_location'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
