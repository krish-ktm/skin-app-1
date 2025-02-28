import React from 'react';
import { Clock, AlertCircle, History } from 'lucide-react';
import { PulseLoader } from 'react-spinners';
import { formatTimeSlot } from '../../../../utils/date';

export interface TimeSlot {
  time: string;
  available: boolean;
  bookingCount?: number;
  isOriginalSlot?: boolean;
}

interface TimeSlotsProps {
  slots: TimeSlot[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  isLoading: boolean;
  error?: string | null;
  isEditing?: boolean;
}

export function TimeSlots({
  slots,
  selectedTime,
  onTimeSelect,
  isLoading,
  error,
  isEditing = false,
}: TimeSlotsProps) {
  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Select Time</label>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Select Time
        {isLoading && (
          <span className="ml-2 inline-block">
            <PulseLoader size={4} color="#3B82F6" />
          </span>
        )}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {slots.length === 0 && !isLoading ? (
          <div className="col-span-4 p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
            No time slots available for this date
          </div>
        ) : (
          slots.map((slot) => (
            <button
              key={slot.time}
              type="button"
              disabled={!slot.available || isLoading}
              onClick={() => onTimeSelect(slot.time)}
              className={`
                px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium
                ${selectedTime === slot.time
                  ? 'bg-blue-500 text-white'
                  : slot.available && !isLoading
                    ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    : slot.isOriginalSlot && isEditing
                      ? 'bg-amber-50 border border-amber-200 text-amber-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-1">
                  {slot.isOriginalSlot && isEditing ? (
                    <History className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  {formatTimeSlot(slot.time)}
                </div>
                {slot.available && slot.bookingCount !== undefined && (
                  <span className="text-xs">
                    {4 - slot.bookingCount} slots left
                  </span>
                )}
                {slot.isOriginalSlot && isEditing && (
                  <span className="text-xs">Original time</span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}