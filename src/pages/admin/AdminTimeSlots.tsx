import React, { useState } from 'react';
import { Calendar } from '../../components/Calendar';
import { TimeSlots, type TimeSlot } from '../../components/TimeSlots';
import { PulseLoader } from 'react-spinners';

const initialTimeSlots: TimeSlot[] = [
  { time: '09:00', available: true },
  { time: '10:00', available: true },
  { time: '11:00', available: true },
  { time: '12:00', available: true },
  { time: '14:00', available: true },
  { time: '15:00', available: true },
  { time: '16:00', available: true },
  { time: '17:00', available: true },
];

export default function AdminTimeSlots() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>(initialTimeSlots);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (!isDateDisabled(newDate)) {
      setSelectedDate(newDate);
      setSelectedTime('');
    }
  };

  const handleTimeSlotToggle = (time: string) => {
    setAvailableSlots(slots =>
      slots.map(slot =>
        slot.time === time
          ? { ...slot, available: !slot.available }
          : slot
      )
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Manage Time Slots</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Calendar
            currentDate={currentDate}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            isDateDisabled={isDateDisabled}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Time Slots</h3>
            {selectedDate ? (
              <>
                <p className="text-sm text-gray-600">
                  Click on a time slot to toggle its availability
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => handleTimeSlotToggle(slot.time)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium
                        ${slot.available
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }
                      `}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500">Please select a date to manage time slots</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}