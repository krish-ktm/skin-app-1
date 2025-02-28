import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';

interface CalendarPickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

export function CalendarPicker({ selectedDate, onDateChange, minDate, maxDate }: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Parse min and max dates if provided
  const parsedMinDate = minDate ? parseISO(minDate) : undefined;
  const parsedMaxDate = maxDate ? parseISO(maxDate) : undefined;

  // Generate calendar days for the current month view
  useEffect(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    // Get all days in the month
    const days = eachDayOfInterval({ start, end });
    
    // Add days from previous month to start the calendar on Sunday
    const startDay = start.getDay();
    if (startDay > 0) {
      const prevMonthDays = eachDayOfInterval({
        start: new Date(start.getFullYear(), start.getMonth(), -startDay + 1),
        end: new Date(start.getFullYear(), start.getMonth(), 0)
      });
      days.unshift(...prevMonthDays);
    }
    
    // Add days from next month to complete the calendar grid
    const endDay = end.getDay();
    if (endDay < 6) {
      const nextMonthDays = eachDayOfInterval({
        start: new Date(end.getFullYear(), end.getMonth() + 1, 1),
        end: new Date(end.getFullYear(), end.getMonth() + 1, 6 - endDay)
      });
      days.push(...nextMonthDays);
    }
    
    setCalendarDays(days);
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  const handleDateSelect = (date: Date) => {
    onDateChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const isDateDisabled = (date: Date) => {
    if (parsedMinDate && date < parsedMinDate) return true;
    if (parsedMaxDate && date > parsedMaxDate) return true;
    return false;
  };

  return (
    <div className="relative">
      <div 
        className="flex items-center border border-gray-300 rounded-lg p-2 cursor-pointer hover:border-blue-500 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
        <input 
          type="text" 
          value={selectedDate ? format(new Date(selectedDate), 'MMMM d, yyyy') : 'Select date'} 
          readOnly 
          className="flex-grow outline-none cursor-pointer"
        />
      </div>
      
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute z-50 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-[320px]"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h3 className="text-base font-semibold text-gray-800">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate ? isSameDay(day, new Date(selectedDate)) : false;
              const isDisabled = isDateDisabled(day);
              const isTodayDate = isToday(day);
              
              return (
                <button
                  key={index}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDateSelect(day)}
                  className={`
                    p-2 text-sm rounded-full relative
                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                    ${isSelected 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : isCurrentMonth && !isDisabled
                        ? 'hover:bg-gray-100 text-gray-700' 
                        : 'text-gray-300 cursor-not-allowed'
                    }
                    ${isTodayDate && !isSelected ? 'font-bold' : ''}
                  `}
                >
                  {day.getDate()}
                  {isTodayDate && !isSelected && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="mt-4 flex justify-between">
            <button
              type="button"
              onClick={() => {
                onDateChange(format(new Date(), 'yyyy-MM-dd'));
                setIsOpen(false);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}