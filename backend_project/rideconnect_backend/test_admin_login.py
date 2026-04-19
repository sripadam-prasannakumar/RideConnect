import requests

url = "http://localhost:8000/api/login/"
data = {
    "email": "drivemate.rideconnect@gmail.com",
    "password": "Rideconnect@67",
    "role": "admin"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
