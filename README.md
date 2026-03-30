# 🚗 Ride Connect

A premium full-stack ride-booking web application built with **React** (frontend) and **Django REST Framework** (backend). Ride Connect connects customers with professional, verified drivers through a sleek, modern interface.

---

## 🌟 Features

### 🎨 Frontend (React)
- **Animated Splash Screen** — Circular logo with rotating ring animations on first load
- **Premium Landing Page** — Hero section, "How It Works" steps, and "Why Choose Us" feature cards
- **Full Authentication Flow** — Register, Login, OTP Email Verification
- **Password Visibility Toggle** — Eye icon to show/hide passwords on all auth forms
- **Customer Dashboard** — Book driver, live searching, driver assigned, ride in progress, ride summary, history, ratings
- **Driver Dashboard** — Incoming requests, accept/reject bookings, ride progress, earnings, vehicles, driver registration & verification
- **Admin Panel** — User management, booking management, platform analytics
- **404 Error Page** — Custom "Lost in Space" design
- **Responsive Design** — Mobile-first layout across all pages

### ⚙️ Backend (Django)
- **Email OTP Registration** — 6-digit OTP sent to user's email on sign-up
- **SMTP Email Delivery** — Configured with Gmail App Password
- **REST API** — Built with Django REST Framework
- **CORS Support** — Cross-Origin Resource Sharing configured for React frontend
- **Admin Interface** — Django admin panel available at `/admin/`

---

## 🛠️ Tech Stack

| Layer      | Technology                                   |
|------------|----------------------------------------------|
| Frontend   | React, React Router DOM, Framer Motion       |
| Styling    | Vanilla CSS, CSS Variables, Glassmorphism    |
| Icons      | Lucide React                                 |
| Backend    | Python, Django, Django REST Framework        |
| Auth       | Email OTP via SMTP (Gmail)                   |
| Database   | SQLite (dev) — configurable for PostgreSQL   |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16+)
- **Python** (v3.9+)
- **pip**

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ride-connect.git
cd ride-connect
```

---

### 2. Backend Setup (Django)

```bash
cd backend_project/rideconnect_backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install django djangorestframework django-cors-headers

# Apply migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional, for admin access)
python manage.py createsuperuser

# Start the server
python manage.py runserver 8000
```

> 📧 **Email Configuration:** In `rideconnect_backend/settings.py`, update the following with your Gmail credentials:
> ```python
> EMAIL_HOST_USER = 'your-email@gmail.com'
> EMAIL_HOST_PASSWORD = 'your-app-password'  # Gmail App Password
> DEFAULT_FROM_EMAIL = 'RideConnect <your-email@gmail.com>'
> ```
> Generate an App Password at: https://myaccount.google.com/apppasswords

---

### 3. Frontend Setup (React)

```bash
cd frontend_project/rideconnect

# Install dependencies
npm install

# Start the development server
npm start
```

The app will be available at **http://localhost:3000**

---

## 📂 Project Structure

```
Ride Connect/
├── backend_project/
│   └── rideconnect_backend/
│       ├── ride/                  # Core app (models, views, urls)
│       │   ├── models.py          # EmailOTP model
│       │   ├── views.py           # RegisterView, VerifyOTPView, HomeView
│       │   └── urls.py
│       └── rideconnect_backend/   # Django settings
│           ├── settings.py
│           └── urls.py
│
└── frontend_project/
    └── rideconnect/
        └── src/
            ├── App.js             # Main router + Splash Screen logic
            ├── components/
            │   ├── Shared/        # Navbar, Button, Input, Card, SplashScreen
            │   ├── Public/        # LandingPage, LoginPage, RegisterPage, OTPPage
            │   ├── Customer/      # Dashboard, BookDriver, RideStatus, etc.
            │   ├── Driver/        # Dashboard, Earnings, Incoming, etc.
            │   ├── Admin/         # Dashboard, Analytics, Management panels
            │   └── Error/         # 404 Page
            └── index.css          # Global design system & CSS variables
```

---

## 🔑 API Endpoints

| Method | Endpoint             | Description                     |
|--------|----------------------|---------------------------------|
| GET    | `/`                  | Welcome message + API list      |
| POST   | `/api/register/`     | Register user, send OTP email   |
| POST   | `/api/verify-otp/`   | Verify the submitted OTP code   |
| GET    | `/admin/`            | Django admin panel              |

---

## 🎨 Design System

- **Theme:** Midnight Sapphire & Electric Blue
- **Effects:** Glassmorphism, neon glows, subtle gradients
- **Animations:** Framer Motion — page transitions, scroll-reveal, micro-interactions
- **Typography:** Inter / Outfit (Google Fonts)

---

## 📋 Registration Flow

1. User fills out the **Register** form (name, email, phone, password)
2. Backend generates a **6-digit OTP** and emails it
3. User is redirected to the **OTP verification** page
4. On success, user is registered and redirected to the dashboard

---

## 🧪 Development Notes

- The backend runs on port **8000** and the frontend on **3000**
- CORS is configured to allow requests from `http://localhost:3000`
- Email is sent via Gmail SMTP — ensure `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` are configured
- SQLite is used in development — switch to PostgreSQL for production

---

## 📝 License

This project is licensed under the **MIT License**.

---

## 🙋 Author

**Ride Connect Team**  
Built with ❤️ using React + Django
