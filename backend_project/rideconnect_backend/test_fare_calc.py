import os
import sys

# Add the project root to sys.path
sys.path.append(r"c:\Users\Lenovo\Desktop\Ride Connect\backend_project\rideconnect_backend")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rideconnect_backend.settings")
import django
django.setup()

from ride.views import calculate_ride_fare

def test_fare():
    print("--- 1. One-Way (10km) ---")
    res = calculate_ride_fare(10, is_pickup_drop=False)
    print(f"Distance: 10km, Total: {res['total_fare']} (Expected: 500.0)")
    
    print("\n--- 2. One-Way (100km) ---")
    res = calculate_ride_fare(100, is_pickup_drop=False)
    print(f"Distance: 100km, Total: {res['total_fare']} (Expected: 920.0)")
    # Onward: 500 + (60 * 7) = 920
    
    print("\n--- 3. Round-Trip (10km) ---")
    res = calculate_ride_fare(10, is_pickup_drop=True)
    print(f"Distance: 10km (+10km return), Total: {res['total_fare']} (Expected: 570.0)")
    # Onward: 500
    # Return: 10 * 7 = 70
    # Total: 570
    
    print("\n--- 4. Round-Trip (100km) ---")
    res = calculate_ride_fare(100, is_pickup_drop=True)
    print(f"Distance: 100km (+100km return), Total: {res['total_fare']} (Expected: 1620.0)")
    # Onward: 500 + (60 * 7) = 920
    # Return: 100 * 7 = 700
    # Total: 1620
    
    print("\nFull Breakdown for Round-Trip (100km):")
    for k, v in res.items():
        print(f"{k}: {v}")

if __name__ == "__main__":
    test_fare()
