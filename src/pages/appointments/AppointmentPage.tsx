import React from 'react';
import AppointmentBooking from './components/AppointmentBooking';

function AppointmentPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AppointmentBooking />
      </div>
    </div>
  );
}

export default AppointmentPage;