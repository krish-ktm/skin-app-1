import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DAYS, MONTHS } from '../../../constants';
import { formatDate, getDaysInMonth } from '../../../utils/date';

interface AppointmentCalendarProps {
  currentDate: Date;
  selectedDate: Date | null;
  onDateSelect: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isDateDisabled: (date: Date) => boolean;
}

export function AppointmentCalendar({
  currentDate,
  selectedDate,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
  isDateDisabled,
}: AppointmentCalendarProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Select Date (Next 3 Days Only)</label>
      <div className="border border-gray-200 rounded-lg p-2 sm:p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onPrevMonth}
            className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          </button>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            type="button"
            onClick={onNextMonth}
            className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map(day => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-600 py-1">
              {day}
            </div>
          ))}
          {getDaysInMonth(currentDate).map((day, index) => (
            <button
              key={index}
              type="button"
              disabled={day === null || (day && isDateDisabled(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)))}
              onClick={() => day && onDateSelect(day)}
              className={`
                p-1 sm:p-2 text-xs sm:text-sm rounded-lg
                ${day === null ? 'invisible' : ''}
                ${day && selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth()
                  ? 'bg-blue-500 text-white'
                  : day && !isDateDisabled(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
                    ? 'hover:bg-gray-100 text-gray-700'
                    : 'text-gray-300 cursor-not-allowed'
                }
              `}
            >
              {day}
            </button>
          ))}
        </div>
        
        {selectedDate && (
          <div className="mt-4 text-xs sm:text-sm text-gray-600">
            Selected: {formatDate(selectedDate)}
          </div>
        )}
      </div>
    </div>
  );
}