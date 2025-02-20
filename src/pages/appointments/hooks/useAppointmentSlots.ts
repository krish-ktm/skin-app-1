import { useState, useCallback } from 'react';
import { appointmentService } from '../../../services/supabase';
import { INITIAL_TIME_SLOTS } from '../../../constants';
import type { TimeSlot } from '../../../types';
import { toUTCDateString } from '../../../utils/date';

export function useAppointmentSlots() {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>(INITIAL_TIME_SLOTS);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  const fetchBookingCounts = useCallback(async (date: Date) => {
    if (!date) return;
    
    setIsFetchingSlots(true);
    try {
      const dateStr = toUTCDateString(date);
      const appointments = await appointmentService.getAppointmentsByDate(dateStr);

      // Count bookings for each time slot
      const counts: { [key: string]: number } = {};
      appointments?.forEach(apt => {
        counts[apt.appointment_time] = (counts[apt.appointment_time] || 0) + 1;
      });

      // Update available slots
      const updatedSlots = INITIAL_TIME_SLOTS.map(slot => ({
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
  }, []);

  return {
    availableSlots,
    isFetchingSlots,
    fetchBookingCounts
  };
}