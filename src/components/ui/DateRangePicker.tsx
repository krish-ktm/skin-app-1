import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, isToday, parseISO } from 'date-fns';

interface DateRange {
  start: string;
  end: string;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  minDate?: string;
  maxDate?: string;
}

export function DateRangePicker({ dateRange, onDateRangeChange, minDate, maxDate }: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [selectingEnd, setSelectingEnd] = useState(false);
  
  const startDate = dateRange.start ? parseISO(dateRange.start) : null;
  const endDate = dateRange.end ? parseISO(dateRange.end) : null;
  
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

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (!startDate || (startDate && endDate) || (startDate && date < startDate)) {
      // Start new selection
      onDateRangeChange({
        start: format(date, 'yyyy-MM-dd'),
        end: ''
      });
      setSelectingEnd(true);
    } else {
      // Complete the selection
      onDateRangeChange({
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(date, 'yyyy-MM-dd')
      });
      setSelectingEnd(false);
    }
  };

  const handleDateHover = (date: Date) => {
    if (selectingEnd && !isDateDisabled(date)) {
      setHoverDate(date);
    }
  };

  const isDateDisabled = (date: Date) => {
    if (parsedMinDate && date < parsedMinDate) return true;
    if (parsedMaxDate && date > parsedMaxDate) return true;
    return false;
  };

  const isInRange = (date: Date) => {
    if (!startDate) return false;
    const end = endDate || hoverDate;
    if (!end) return false;
    return isWithinInterval(date, { start: startDate, end });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
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
          const isSelected = startDate && isSameDay(day, startDate) || endDate && isSameDay(day, endDate);
          const isRangeDate = isInRange(day);
          const isDisabled = isDateDisabled(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          
          return (
            <button
              key={index}
              type="button"
              disabled={isDisabled}
              onClick={() => handleDateClick(day)}
              onMouseEnter={() => handleDateHover(day)}
              onMouseLeave={() => setHoverDate(null)}
              className={`
                relative p-2 text-sm rounded-full transition-colors
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${isSelected 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : isRangeDate
                    ? 'bg-blue-50 text-blue-700'
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
      
      <div className="mt-4 text-sm text-gray-600">
        {startDate && (
          <p>
            Start: {format(startDate, 'MMM dd, yyyy')}
            {endDate && (
              <>
                <br />
                End: {format(endDate, 'MMM dd, yyyy')}
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}