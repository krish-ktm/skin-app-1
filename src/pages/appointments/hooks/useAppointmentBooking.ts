import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { nanoid } from 'nanoid';

interface FormData {
  name: string;
  phone: string;
  caseId: string;
}

interface Appointment {
  case_id: string;
  name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
}

interface BookingStatus {
  success?: boolean;
  message?: string;
  appointment?: Appointment;
}

export function useAppointmentBooking(
  formData: FormData,
  selectedDate: Date | null,
  selectedTime: string,
  showNotification: (message: string, type: 'success' | 'error') => void
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
      showNotification('Please select both date and time for your appointment', 'error');
      return;
    }

    setIsLoading(true);
    const caseId = nanoid(10).toUpperCase();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check current booking count
      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data: existingBookings } = await supabase
        .from('appointments')
        .select('id')
        .eq('appointment_date', dateStr)
        .eq('appointment_time', selectedTime);

      if (existingBookings && existingBookings.length >= 4) {
        throw new Error('This time slot is now full. Please select another time.');
      }

      const appointment: Appointment = {
        case_id: caseId,
        name: formData.name,
        phone: formData.phone,
        appointment_date: dateStr,
        appointment_time: selectedTime,
      };

      const { error } = await supabase
        .from('appointments')
        .insert({ ...appointment, user_id: user.id });

      if (error) throw error;

      setBookingStatus({
        success: true,
        message: 'Appointment booked successfully!',
        appointment,
      });

      showNotification('Appointment booked successfully!', 'success');
    } catch (error: any) {
      setBookingStatus({
        success: false,
        message: error.message || 'Failed to book appointment. Please try again.',
      });
      showNotification(error.message || 'Failed to book appointment', 'error');
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