import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { toUTCDateString } from '../../../../utils/date';

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [disabledDays, setDisabledDays] = useState<string[]>([]);

  useEffect(() => {
    fetchDisabledDays();
  }, [currentDate]);

  // Initial setup to check if today is available
  useEffect(() => {
    const initializeDate = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayStr = toUTCDateString(today);
      
      try {
        const { data: disabledSlots, error } = await supabase
          .from('time_slot_settings')
          .select('date')
          .is('time', null)
          .eq('is_disabled', true)
          .eq('date', todayStr);

        if (error) throw error;

        // If today is not disabled, set it as the selected date
        if (!disabledSlots || disabledSlots.length === 0) {
          setSelectedDate(today);
        } else {
          // Find the next available date within the next 3 days
          for (let i = 1; i <= 3; i++) {
            const nextDate = new Date(today);
            nextDate.setDate(today.getDate() + i);
            const nextDateStr = toUTCDateString(nextDate);
            
            const { data: nextDisabledSlots, error: nextError } = await supabase
              .from('time_slot_settings')
              .select('date')
              .is('time', null)
              .eq('is_disabled', true)
              .eq('date', nextDateStr);

            if (nextError) throw nextError;

            if (!nextDisabledSlots || nextDisabledSlots.length === 0) {
              setSelectedDate(nextDate);
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error checking initial date:', error);
      }
    };

    initializeDate();
  }, []);

  const fetchDisabledDays = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('time_slot_settings')
        .select('date')
        .is('time', null)
        .eq('is_disabled', true)
        .gte('date', toUTCDateString(startOfMonth))
        .lte('date', toUTCDateString(endOfMonth));

      if (error) throw error;
      setDisabledDays(data?.map(d => d.date) || []);
    } catch (error) {
      console.error('Error fetching disabled days:', error);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const maxDate = new Date();
    maxDate.setHours(0, 0, 0, 0);
    maxDate.setDate(today.getDate() + 3);
    
    // Check if date is outside the allowed range
    if (date < today || date > maxDate) {
      return true;
    }

    // Check if date is in disabled days
    const dateStr = toUTCDateString(date);
    return disabledDays.includes(dateStr);
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (!isDateDisabled(newDate)) {
      setSelectedDate(newDate);
    }
  };

  return {
    currentDate,
    selectedDate,
    setSelectedDate,
    handlePrevMonth,
    handleNextMonth,
    handleDateSelect,
    isDateDisabled
  };
}