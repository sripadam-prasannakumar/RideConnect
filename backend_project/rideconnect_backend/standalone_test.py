import math

def calculate_ride_fare(distance_km, is_pickup_drop, is_daily_package=False, waiting_time_minutes=0):
    # Logic copied from views.py for verification
    if is_daily_package:
        base_fare = 1000
        onward_distance = distance_km
        return_distance = 0
        extra_distance = max(0, distance_km - 150)
        extra_charge = extra_distance * 3
        onward_fare = base_fare + extra_charge
        return_fare = 0
    else:
        # Standard Pricing
        base_fare = 600
        onward_distance = distance_km
        extra_distance = max(0, distance_km - 40)
        extra_charge = extra_distance * 3
        onward_fare = base_fare + extra_charge
        
        if is_pickup_drop:
            return_distance = distance_km
            return_fare = return_distance * 3
        else:
            return_distance = 0
            return_fare = 0

    # Waiting Charges (Applicable for pickup+drop / daily)
    waiting_charge = 0
    if is_pickup_drop:
        waiting_charge = (waiting_time_minutes / 60.0) * 35.0

    total_fare = onward_fare + return_fare + waiting_charge
    
    return {
        "total_fare": math.ceil(total_fare),
        "waiting_charge": math.ceil(waiting_charge),
        "onward_fare": onward_fare,
        "return_fare": return_fare
    }

def test_fare_logic():
    scenarios = [
        {"name": "Daily Package - 100km", "params": [100, True, True, 0], "expected": 1000},
        {"name": "Daily Package - 160km", "params": [160, True, True, 0], "expected": 1030},
        {"name": "Daily Package - 100km + 2h Wait", "params": [100, True, True, 120], "expected": 1070},
        {"name": "One-Way - 30km", "params": [30, False, False, 0], "expected": 600},
        {"name": "One-Way - 50km", "params": [50, False, False, 0], "expected": 630},
        {"name": "Round-Trip - 30km", "params": [30, True, False, 0], "expected": 690},
        {"name": "Round-Trip - 50km", "params": [50, True, False, 0], "expected": 780},
        {"name": "Round-Trip - 30km + 1h Wait", "params": [30, True, False, 60], "expected": 725},
    ]

    for s in scenarios:
        res = calculate_ride_fare(*s['params'])
        actual = res['total_fare']
        print(f"{s['name']}: {'PASSED' if actual == s['expected'] else 'FAILED (Got ' + str(actual) + ')'}")

if __name__ == "__main__":
    test_fare_logic()
