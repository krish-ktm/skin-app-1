import { useState } from 'react';
import { nanoid } from 'nanoid';
import { supabase } from '../../../lib/supabase';
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
    // Only generate a new case ID if it's a new patient
    const caseId = formData.caseId || nanoid(10).toUpperCase();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dateStr = toUTCDateString(selectedDate);

      // Check current booking count
      const { data: existingBookings, error: countError } = await supabase
        .from('appointments')
        .select('id')
        .eq('appointment_date', dateStr)
        .eq('appointment_time', selectedTime);

      if (countError) throw countError;

      if (existingBookings && existingBookings.length >= 4) {
        throw new Error('This time slot is now full. Please select another time.');
      }

      const appointment: Omit<Appointment, 'id' | 'created_at'> = {
        case_id: caseId,
        name: formData.name,
        phone: formData.phone,
        appointment_date: dateStr,
        appointment_time: selectedTime,
        gender: formData.gender, // Use the selected gender from the form
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single();

      if (error) throw error;

      const successAppointment: Appointment = {
        id: data.id,
        case_id: data.case_id,
        name: data.name,
        phone: data.phone,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        created_at: data.created_at,
        gender: data.gender
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