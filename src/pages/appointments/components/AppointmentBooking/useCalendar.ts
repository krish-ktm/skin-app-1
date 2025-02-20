import { useState } from 'react';

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
    
    return date < today || date > maxDate;
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