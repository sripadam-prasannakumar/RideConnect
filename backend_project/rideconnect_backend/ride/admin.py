from django.contrib import admin
from .models import Driver, Customer, Ride, UserVehicle, UserVehicleImage, CarBrand, CarModel, EmailOTP

@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['get_name', 'get_email', 'phone', 'vehicle_type', 'verification_status', 'is_online']
    list_filter = ['verification_status', 'is_online', 'vehicle_type']
    search_fields = ['user__username', 'user__email', 'phone']
    actions = ['approve_drivers', 'reject_drivers']

    @admin.display(description='Name')
    def get_name(self, obj):
        name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return name if name else obj.user.username

    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email

    @admin.action(description="Approve selected drivers")
    def approve_drivers(self, request, queryset):
        for driver in queryset:
            driver.verification_status = 'approved'
            driver.save()
        self.message_user(request, "Selected drivers have been approved.")

    @admin.action(description="Reject selected drivers")
    def reject_drivers(self, request, queryset):
        for driver in queryset:
            driver.verification_status = 'rejected'
            driver.save()
        self.message_user(request, "Selected drivers have been rejected.")

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['get_name', 'get_email', 'phone', 'is_online']
    search_fields = ['user__username', 'user__email', 'phone']

    @admin.display(description='Name')
    def get_name(self, obj):
        name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return name if name else obj.user.username

    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email

@admin.register(Ride)
class RideAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'driver', 'status', 'fare_display', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['customer__user__username', 'driver__user__username']

    @admin.display(description='Fare')
    def fare_display(self, obj):
        return f"₹{obj.price}"

@admin.register(UserVehicle)
class UserVehicleAdmin(admin.ModelAdmin):
    list_display = ['user', 'vehicle_type', 'brand', 'model_name', 'registration_number']
    list_filter = ['vehicle_type']
    search_fields = ['user__username', 'registration_number']

@admin.register(UserVehicleImage)
class UserVehicleImageAdmin(admin.ModelAdmin):
    list_display = ['vehicle', 'uploaded_at']

@admin.register(CarBrand)
class CarBrandAdmin(admin.ModelAdmin):
    list_display = ['brand_name']

@admin.register(CarModel)
class CarModelAdmin(admin.ModelAdmin):
    list_display = ['brand', 'model_name']
    list_filter = ['brand']

@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ['email', 'otp', 'created_at']
    search_fields = ['email']
