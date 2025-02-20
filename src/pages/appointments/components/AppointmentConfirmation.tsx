import React from 'react';
import type { Appointment } from '../../../types';
import { Button } from '../../../components/ui/Button';

interface AppointmentConfirmationProps {
  appointment: Appointment;
  onBookAnother: () => void;
}

export function AppointmentConfirmation({
  appointment,
  onBookAnother,
}: AppointmentConfirmationProps) {
  return (
    <div className="text-center p-4 sm:p-6 bg-green-50 rounded-lg">
      <h3 className="text-xl font-semibold text-green-800 mb-4">Booking Confirmed!</h3>
      <div className="space-y-3 text-left max-w-md mx-auto bg-white p-4 rounded-lg border border-green-200">
        <p className="font-mono bg-green-100 p-2 rounded text-sm sm:text-base">
          Case ID: {appointment.case_id}
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm sm:text-base">
          <p className="text-gray-600">Name:</p>
          <p className="font-medium">{appointment.name}</p>
          <p className="text-gray-600">Phone:</p>
          <p className="font-medium">{appointment.phone}</p>
          <p className="text-gray-600">Date:</p>
          <p className="font-medium">
            {new Date(appointment.appointment_date).toLocaleDateString()}
          </p>
          <p className="text-gray-600">Time:</p>
          <p className="font-medium">{appointment.appointment_time}</p>
        </div>
      </div>
      <div className="mt-6">
        <Button onClick={onBookAnother} variant="outline">
          Book Another Appointment
        </Button>
      </div>
    </div>
  );
}