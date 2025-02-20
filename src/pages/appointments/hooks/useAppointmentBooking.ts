import { useState } from 'react';
import { nanoid } from 'nanoid';
import { appointmentService } from '../../../services/supabase';
import { supabase } from '../../../services/supabase';
import type { Appointment, BookingStatus, FormData } from '../../../types';
import { toUTCDateString } from '../../../utils/date';

export function useAppointmentBooking(
  formData: FormData,
  selectedDate: Date | null,
  selectedTime: string,
  onSuccess?: (appointment: Appointment) => void,
  onError?: (message: string) => void
) {
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      setBookingStatus({
        success: false,
        message: 'Please select both date and time for your appointment',
      });
      onError?.('Please select both date and time for your appointment');
      return;
    }

    setIsLoading(true);
    const caseId = nanoid(10).toUpperCase();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dateStr = toUTCDateString(selectedDate);

      // Check current booking count
      const existingBookings = await appointmentService.getAppointmentsByDate(dateStr);

      if (existingBookings && existingBookings.length >= 4) {
        throw new Error('This time slot is now full. Please select another time.');
      }

      const appointment: Omit<Appointment, 'id' | 'created_at'> = {
        case_id: caseId,
        name: formData.name,
        phone: formData.phone,
        appointment_date: dateStr,
        appointment_time: selectedTime,
        gender: 'male', // Default value as per schema
      };

      await appointmentService.createAppointment({ ...appointment, user_id: user.id });

      const successAppointment = {
        ...appointment,
        id: '', // Will be filled by Supabase
        created_at: new Date().toISOString(),
      };

      setBookingStatus({
        success: true,
        message: 'Appointment booked successfully!',
        appointment: successAppointment,
      });

      onSuccess?.(successAppointment);
    } catch (error: any) {
      const message = error.message || 'Failed to book appointment. Please try again.';
      setBookingStatus({
        success: false,
        message,
      });
      onError?.(message);
      console.error('Booking error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    bookingStatus,
    setBookingStatus,
    isLoading,
    handleSubmit
  };
}