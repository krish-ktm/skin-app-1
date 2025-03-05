import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppointmentPage from './pages/appointments/AppointmentPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/components/AdminBookings';
import AdminTimeSlots from './pages/admin/AdminTimeSlots';
import AdminUsers from './pages/admin/AdminUsers';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path="/" element={<AppointmentPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="time-slots" element={<AdminTimeSlots />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;