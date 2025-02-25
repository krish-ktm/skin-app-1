import { useState, useCallback } from 'react';
import { appointmentService } from '../../../services/supabase';
import { INITIAL_TIME_SLOTS, TIME_ZONE } from '../../../constants';
import type { TimeSlot } from '../../../types';
import { toUTCDateString, isTimeSlotExpired } from '../../../utils/date';

export function useAppointmentSlots() {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>(INITIAL_TIME_SLOTS);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDayDisabled, setIsDayDisabled] = useState(false);

  const fetchBookingCounts = useCallback(async (date: Date) => {
    if (!date) return;
    
    setIsFetchingSlots(true);
    setError(null);
    try {
      const dateStr = toUTCDateString(date);
      const { appointments, disabledSlots } = await appointmentService.getAppointmentsByDate(dateStr);

      // Check if the entire day is disabled
      const dayDisabled = disabledSlots?.some(slot => slot.time === null);
      setIsDayDisabled(dayDisabled);

      if (dayDisabled) {
        setAvailableSlots([]);
        throw new Error('This day is not available for bookings');
      }

      // Count bookings for each time slot
      const counts: { [key: string]: number } = {};
      appointments?.forEach(apt => {
        counts[apt.appointment_time] = (counts[apt.appointment_time] || 0) + 1;
      });

      // Update available slots
      const updatedSlots = INITIAL_TIME_SLOTS.map(slot => {
        const isExpired = isTimeSlotExpired(slot.time, date);
        const isDisabled = disabledSlots.some(ds => ds.time === slot.time);
        return {
          ...slot,
          bookingCount: counts[slot.time] || 0,
          available: !isExpired && !isDisabled && (counts[slot.time] || 0) < 4
        };
      });

      setAvailableSlots(updatedSlots);
    } catch (error: any) {
      console.error('Error updating slots:', error);
      setError(error.message);
      setAvailableSlots([]);
    } finally {
      setIsFetchingSlots(false);
    }
  }, []);

  return {
    availableSlots,
    isFetchingSlots,
    error,
    isDayDisabled,
    fetchBookingCounts
  };
}