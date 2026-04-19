import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { UserProvider } from './UserContext';
import { ThemeProvider } from './ThemeContext';
import './App.css';
import CustomerLayout from './components/Layouts/CustomerLayout';
import DriverLayout from './components/Layouts/DriverLayout';

// Components
import Splash from './components/Public/Splash';
import Welcome from './components/Public/Welcome';
import RoleSelection from './components/Public/RoleSelection';
import LoginPage from './components/Public/LoginPage';
import RegisterPage from './components/Public/RegisterPage';
import OTPPage from './components/Public/OTPPage';
import ForgotPasswordPage from './components/Public/ForgotPasswordPage';
import CustomerDashboard from './components/Customer/Dashboard';
import VehicleSelection from './components/Customer/VehicleSelection';
import AddVehicleDetails from './components/Customer/AddVehicleDetails';
import BookDriver from './components/Customer/BookDriver';
import SearchingDriver from './components/Customer/SearchingDriver';
import DriverAssigned from './components/Customer/DriverAssigned';
import RideHistory from './components/Customer/RideHistory';
import CustomerProfile from './components/Customer/Profile';
import DriverDashboard from './components/Driver/Dashboard';
import DriverProfile from './components/Driver/Profile';
import DriverEarnings from './components/Driver/Earnings';
import LicenseUpload from './components/Driver/DocumentUpload';
import TripStatus from './components/Driver/TripStatus';
import DriverNavigation from './components/Driver/DriverNavigation';
import AdminDashboard from './components/Admin/Dashboard';
import Settings from './components/Customer/Settings';
import ProtectedRoute from './components/Shared/ProtectedRoute';
import NotFound from './components/Public/NotFound';
import LiveTrackingMap from './components/Customer/LiveTrackingMap';
import DriverTracking from './components/Customer/DriverTracking';
import Offers from './components/Customer/Offers';
import PlatformSettings from './components/Admin/PlatformSettings';
import CommissionTracking from './components/Admin/CommissionTracking';

function AppContent() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Splash />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/secure-admin-login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OTPPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/test-tracking" element={<LiveTrackingMap />} />

        {/* Customer Routes */}
        <Route element={
          <ProtectedRoute role="customer">
            <CustomerLayout />
          </ProtectedRoute>
        }>
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/vehicles" element={<VehicleSelection />} />
          <Route path="/customer/add-vehicle" element={<AddVehicleDetails />} />
          <Route path="/customer/book" element={<BookDriver />} />
          <Route path="/customer/searching" element={<SearchingDriver />} />
          <Route path="/customer/tracking" element={<DriverTracking />} />
          <Route path="/customer/driver-assigned" element={<DriverAssigned />} />
           <Route path="/customer/history" element={<RideHistory />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/customer/settings" element={<Settings />} />
          <Route path="/customer/offers" element={<Offers />} />
        </Route>

        {/* Driver Routes */}
        <Route element={
          <ProtectedRoute role="driver">
            <DriverLayout />
          </ProtectedRoute>
        }>
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/driver/navigation" element={<DriverNavigation />} />
          <Route path="/driver/trip-status" element={<TripStatus />} />
          <Route path="/driver/profile" element={<DriverProfile />} />
          <Route path="/driver/earnings" element={<DriverEarnings />} />
          <Route path="/driver/history" element={<RideHistory />} />
          <Route path="/driver/settings" element={<Settings />} />
          <Route path="/driver/license" element={<LicenseUpload />} />
        </Route>

        {/* Admin Routes */}
        <Route element={
          <ProtectedRoute role="admin" />
        }>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/platform-settings" element={<PlatformSettings />} />
          <Route path="/admin/platform_settings" element={<PlatformSettings />} />
          <Route path="/admin/commissions" element={<CommissionTracking />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Router>
          <div className="App">
            <AppContent />
          </div>
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
