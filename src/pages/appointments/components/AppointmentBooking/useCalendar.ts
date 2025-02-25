import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { toUTCDateString } from '../../../../utils/date';

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [disabledDays, setDisabledDays] = useState<string[]>([]);

  useEffect(() => {
    fetchDisabledDays();
  }, [currentDate]);

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