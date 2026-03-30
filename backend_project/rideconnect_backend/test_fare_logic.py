import os
import django
import sys

# Setup Django environment
sys.path.append(r'c:\Users\Lenovo\Desktop\Ride Connect\backend_project\rideconnect_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideconnect_backend.settings')
django.setup()

from ride.views import calculate_ride_fare

def test_fare_logic():
    scenarios = [
        # 1. Daily Package (Pickup + Drop)
        {
            "name": "Daily Package - Within 150km",
            "params": {"distance_km": 100, "is_pickup_drop": True, "is_daily_package": True, "waiting_time_minutes": 0},
            "expected_fare": 1000
        },
        {
            "name": "Daily Package - 160km (10km extra)",
            "params": {"distance_km": 160, "is_pickup_drop": True, "is_daily_package": True, "waiting_time_minutes": 0},
            "expected_fare": 1030 # 1000 + (10 * 3)
        },
        {
            "name": "Daily Package - 100km + 120min waiting",
            "params": {"distance_km": 100, "is_pickup_drop": True, "is_daily_package": True, "waiting_time_minutes": 120},
            "expected_fare": 1070 # 1000 + (2h * 35)
        },
        
        # 2. Standard One-Way
        {
            "name": "One-Way - 30km (Within 40km)",
            "params": {"distance_km": 30, "is_pickup_drop": False, "is_daily_package": False, "waiting_time_minutes": 0},
            "expected_fare": 600
        },
        {
            "name": "One-Way - 50km (10km extra)",
            "params": {"distance_km": 50, "is_pickup_drop": False, "is_daily_package": False, "waiting_time_minutes": 0},
            "expected_fare": 630 # 600 + (10 * 3)
        },
        
        # 3. Standard Round-Trip
        {
            "name": "Round-Trip - Onward 30km (Total 60km)",
            "params": {"distance_km": 30, "is_pickup_drop": True, "is_daily_package": False, "waiting_time_minutes": 0},
            "expected_fare": 690 # Onward (600) + Return (30 * 3 = 90) = 690
        },
        {
            "name": "Round-Trip - Onward 50km (Total 100km)",
            "params": {"distance_km": 50, "is_pickup_drop": True, "is_daily_package": False, "waiting_time_minutes": 0},
            "expected_fare": 780 # Onward (600 + 10*3=630) + Return (50 * 3 = 150) = 780
        },
        {
            "name": "Round-Trip - 30km + 60min waiting",
            "params": {"distance_km": 30, "is_pickup_drop": True, "is_daily_package": False, "waiting_time_minutes": 60},
            "expected_fare": 725 # 690 + 35 = 725
        }
    ]

    print(f"{'Scenario Name':<40} | {'Expected':<10} | {'Actual':<10} | {'Status'}")
    print("-" * 75)
    
    all_passed = True
    for s in scenarios:
        res = calculate_ride_fare(**s['params'])
        actual = res['total_fare']
        status = "PASSED" if actual == s['expected_fare'] else "FAILED"
        if actual != s['expected_fare']: all_passed = False
        print(f"{s['name']:<40} | {s['expected_fare']:<10} | {actual:<10} | {status}")
        if actual != s['expected_fare']:
            print(f"   Details: {res}")

    if all_passed:
        print("\nALL TESTS PASSED! ✅")
    else:
        print("\nSOME TESTS FAILED! ❌")

if __name__ == "__main__":
    test_fare_logic()
