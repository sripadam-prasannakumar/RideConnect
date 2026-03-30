import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def test_ride_flow():
    # 0. Setup: Ensure we have a pending/accepted ride
    # For this test, we'll fetch all bookings and find one
    print(f"Fetching bookings from: {BASE_URL}/admin/bookings/?status=all")
    res = requests.get(f"{BASE_URL}/admin/bookings/?status=all")
    print(f"Response Status: {res.status_code}")
    if res.status_code != 200:
        print(f"Error Response Body: {res.text[:2000]}")
        return
    bookings = res.json()
    
    ride = None
    for b in bookings:
        if b['status'] == 'accepted':
            ride = b
            break
            
    if not ride:
        print("No accepted ride found to test. Please book a ride first.")
        return

    ride_id = ride['id']
    ride_otp = ride['otp']
    print(f"Testing Ride Flow for Ride ID: {ride_id} (OTP: {ride_otp})")

    # 1. Start Ride (Wrong OTP)
    print("\nAttempting to Start Ride with WRONG OTP...")
    wrong_otp_res = requests.post(f"{BASE_URL}/ride/verify-otp/{ride_id}/", json={"otp": "0000"})
    if wrong_otp_res.status_code == 400:
        print("SUCCESS: Rejected wrong OTP as expected.")
    else:
        print(f"FAILED: Status {wrong_otp_res.status_code}")
        print(wrong_otp_res.text)

    # 2. Start Ride (Correct OTP)
    print("\nAttempting to Start Ride with CORRECT OTP...")
    start_res = requests.post(f"{BASE_URL}/ride/verify-otp/{ride_id}/", json={"otp": ride_otp})
    if start_res.status_code == 200:
        print("SUCCESS: Ride Started via OTP.")
        print(json.dumps(start_res.json(), indent=2))
    else:
        print(f"FAILED: Status {start_res.status_code}")
        print(start_res.text)
        return

    # Wait a bit
    print("\nWaiting 2 seconds...")
    time.sleep(2)

    # 3. End Ride
    print("\nAttempting to End Ride...")
    end_res = requests.post(f"{BASE_URL}/ride/end/{ride_id}/")
    if end_res.status_code == 200:
        print("SUCCESS: Ride Ended.")
        data = end_res.json()
        print(json.dumps(data, indent=2))
        print(f"\nCalculated Fare: {data.get('price')}")
        print(f"Commission (12%): {data.get('commission_amount')}")
        print(f"Driver Amount (88%): {data.get('driver_amount')}")
    else:
        print(f"FAILED: Status {end_res.status_code}")
        print(end_res.text)

if __name__ == "__main__":
    test_ride_flow()
