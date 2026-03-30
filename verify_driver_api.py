import requests
import json

BASE_URL = "http://127.0.0.1:8000"
EMAIL = "test_duplicate" # Correct username from DB

def test_driver_stats():
    print(f"Testing Driver Dashboard Stats for {EMAIL}...")
    try:
        response = requests.get(f"{BASE_URL}/api/driver/dashboard-stats/?email={EMAIL}")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

def test_driver_toggle():
    print(f"\nTesting Driver Status Toggle for {EMAIL}...")
    try:
        # Toggle Online
        response = requests.post(f"{BASE_URL}/api/driver/status-toggle/", json={"email": EMAIL, "is_online": True})
        print(f"Online Toggle Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        # Toggle Offline
        response = requests.post(f"{BASE_URL}/api/driver/status-toggle/", json={"email": EMAIL, "is_online": False})
        print(f"Offline Toggle Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Note: This requires a driver with this email to exist in the DB.
    # If not, it will return 404.
    test_driver_stats()
    test_driver_toggle()
