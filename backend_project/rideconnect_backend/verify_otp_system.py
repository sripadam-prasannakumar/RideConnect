import requests
import time
from datetime import timedelta
import sqlite3
import os

BASE_URL = "http://localhost:8000/api"
DB_PATH = "c:/Users/Lenovo/Desktop/Ride Connect/backend_project/rideconnect_backend/db.sqlite3"

def get_otp_from_db(email):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT otp FROM ride_emailotp WHERE email=?", (email,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def expire_otp_in_db(email):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Set created_at to 6 minutes ago
    cursor.execute("UPDATE ride_emailotp SET created_at = datetime('now', '-6 minutes') WHERE email=?", (email,))
    conn.commit()
    conn.close()

def test_otp_flow():
    email = f"test_{int(time.time())}@example.com"
    print(f"Testing with email: {email}")

    # 1. Registration
    print("Testing Registration...")
    reg_data = {
        "email": email,
        "password": "Password123!",
        "name": "Test User",
        "phone": "1234567890",
        "role": "customer"
    }
    resp = requests.post(f"{BASE_URL}/register/", json=reg_data)
    print(f"Reg status: {resp.status_code}")
    assert resp.status_code == 201

    otp = get_otp_from_db(email)
    print(f"Generated OTP: {otp}")
    assert otp is not None

    # 2. Verification
    print("Testing Verification...")
    verify_data = {"email": email, "otp": otp}
    resp = requests.post(f"{BASE_URL}/verify-otp/", json=verify_data)
    print(f"Verify status: {resp.status_code}, msg: {resp.json().get('message')}")
    assert resp.status_code == 200

    # 3. Login
    print("Testing Login...")
    login_data = {"email": email, "password": "Password123!", "role": "customer"}
    resp = requests.post(f"{BASE_URL}/login/", json=login_data)
    print(f"Login status: {resp.status_code}, require_otp: {resp.json().get('require_otp')}")
    assert resp.status_code == 200
    assert resp.json().get('require_otp') == True

    otp = get_otp_from_db(email)
    print(f"Login OTP: {otp}")
    assert otp is not None

    # 4. Expiration
    print("Testing Expiration...")
    expire_otp_in_db(email)
    verify_data = {"email": email, "otp": otp}
    resp = requests.post(f"{BASE_URL}/verify-otp/", json=verify_data)
    print(f"Expired Verify status: {resp.status_code}, error: {resp.json().get('error')}")
    assert resp.status_code == 400
    assert "expired" in resp.json().get('error').lower()

    print("OTP System Verification Passed!")

if __name__ == "__main__":
    try:
        test_otp_flow()
    except Exception as e:
        print(f"Test failed: {e}")
