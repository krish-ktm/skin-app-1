import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { TimeSlot } from '../components/TimeSlots';

export function useAppointmentSlots(initialSlots: TimeSlot[]) {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>(initialSlots);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  const fetchBookingCounts = async (date: Date) => {
    if (!date) return;
    
    setIsFetchingSlots(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('appointment_date', dateStr);

      if (error) {
        console.error('Error fetching appointments:', error);
        throw new Error('Error loading time slots. Please try again.');
      }

      // Count bookings for each time slot
      const counts: { [key: string]: number } = {};
      appointments?.forEach(apt => {
        counts[apt.appointment_time] = (counts[apt.appointment_time] || 0) + 1;
      });

      // Update available slots
      const updatedSlots = initialSlots.map(slot => ({
        ...slot,
        bookingCount: counts[slot.time] || 0,
        available: slot.available && (counts[slot.time] || 0) < 4
      }));

      setAvailableSlots(updatedSlots);
    } catch (error) {
      console.error('Error updating slots:', error);
      throw new Error('Error updating time slots. Please try again.');
    } finally {
      setIsFetchingSlots(false);
    }
  };

  return {
    availableSlots,
    isFetchingSlots,
    fetchBookingCounts
  };
}