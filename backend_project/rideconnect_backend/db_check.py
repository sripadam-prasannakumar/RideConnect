import sqlite3
DB_PATH = "c:/Users/Lenovo/Desktop/Ride Connect/backend_project/rideconnect_backend/db.sqlite3"

def check_otps():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, otp, created_at FROM ride_emailotp ORDER BY id DESC LIMIT 5;")
        rows = cursor.fetchall()
        print("Recent OTPs in DB:")
        for r in rows:
            print(f"ID: {r[0]}, Email: {r[1]}, OTP: {r[2]}, Created: {r[3]}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_otps()
