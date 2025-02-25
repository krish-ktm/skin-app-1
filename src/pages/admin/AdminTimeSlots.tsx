import React, { useState, useEffect } from 'react';
import { Calendar } from '../../components/Calendar';
import { PulseLoader } from 'react-spinners';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Clock, Ban, Calendar as CalendarIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimeSlotSetting {
  id: string;
  date: string;
  time: string | null;
  is_disabled: boolean;
}

export default function AdminTimeSlots() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState([
    '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00'
  ]);
  const [disabledSlots, setDisabledSlots] = useState<TimeSlotSetting[]>([]);
  const [isDayDisabled, setIsDayDisabled] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlotSettings();
    }
  }, [selectedDate]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Helper function to convert Date to YYYY-MM-DD format in local timezone
  const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchTimeSlotSettings = async () => {
    if (!selectedDate) return;

    setIsLoading(true);
    try {
      const dateStr = formatDateToLocal(selectedDate);
      const { data, error } = await supabase
        .from('time_slot_settings')
        .select('*')
        .eq('date', dateStr);

      if (error) throw error;

      setDisabledSlots(data || []);
      setIsDayDisabled(data?.some(slot => slot.time === null && slot.is_disabled) || false);
    } catch (error) {
      console.error('Error fetching time slot settings:', error);
      showNotification('Failed to fetch time slot settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const toggleTimeSlot = async (time: string) => {
    if (!selectedDate) return;

    const dateStr = formatDateToLocal(selectedDate);
    const existingSetting = disabledSlots.find(slot => slot.time === time);
    
    try {
      if (existingSetting) {
        // Update existing setting - this will trigger the cleanup if is_disabled is set to false
        const { error } = await supabase
          .from('time_slot_settings')
          .update({ is_disabled: !existingSetting.is_disabled })
          .eq('id', existingSetting.id);

        if (error) throw error;
      } else {
        // Create new setting only if we're disabling the slot
        const { error } = await supabase
          .from('time_slot_settings')
          .insert({
            date: dateStr,
            time: time,
            is_disabled: true
          });

        if (error) throw error;
      }

      await fetchTimeSlotSettings();
      showNotification('Time slot updated successfully', 'success');
    } catch (error) {
      console.error('Error toggling time slot:', error);
      showNotification('Failed to update time slot', 'error');
    }
  };

  const toggleFullDay = async () => {
    if (!selectedDate) return;

    const dateStr = formatDateToLocal(selectedDate);
    const existingSetting = disabledSlots.find(slot => slot.time === null);
    
    try {
      if (existingSetting) {
        // Update existing setting - this will trigger the cleanup if is_disabled is set to false
        const { error } = await supabase
          .from('time_slot_settings')
          .update({ is_disabled: !existingSetting.is_disabled })
          .eq('id', existingSetting.id);

        if (error) throw error;

        // If we're enabling the full day, also remove all individual time slot settings
        if (!existingSetting.is_disabled) {
          const { error: deleteError } = await supabase
            .from('time_slot_settings')
            .delete()
            .eq('date', dateStr)
            .neq('id', existingSetting.id);

          if (deleteError) throw deleteError;
        }
      } else {
        // Create new setting only if we're disabling the day
        const { error } = await supabase
          .from('time_slot_settings')
          .insert({
            date: dateStr,
            time: null,
            is_disabled: true
          });

        if (error) throw error;
      }

      await fetchTimeSlotSettings();
      showNotification('Full day setting updated successfully', 'success');
    } catch (error) {
      console.error('Error toggling full day:', error);
      showNotification('Failed to update full day setting', 'error');
    }
  };

  const isSlotDisabled = (time: string) => {
    return disabledSlots.some(slot => 
      (slot.time === time || slot.time === null) && slot.is_disabled
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Manage Time Slots</h2>
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <p className={`text-sm ${
                  notification.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {notification.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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

        <div className="space-y-6">
          {selectedDate ? (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Full Day Management</h3>
                  <Button
                    onClick={toggleFullDay}
                    variant={isDayDisabled ? 'outline' : 'primary'}
                    icon={isDayDisabled ? <CheckCircle2 className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
                  >
                    {isDayDisabled ? 'Enable Full Day' : 'Disable Full Day'}
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  {isDayDisabled 
                    ? 'This day is currently disabled for all appointments' 
                    : 'You can disable all appointments for this day'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Individual Time Slots</h3>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <PulseLoader color="#3B82F6" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {timeSlots.map((time) => {
                      const disabled = isSlotDisabled(time);
                      return (
                        <button
                          key={time}
                          onClick={() => toggleTimeSlot(time)}
                          disabled={isDayDisabled}
                          className={`
                            p-3 rounded-lg text-sm font-medium
                            flex flex-col items-center gap-2
                            transition-all duration-200
                            ${isDayDisabled
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : disabled
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }
                          `}
                        >
                          <Clock className="h-4 w-4" />
                          <span>{time}</span>
                          <span className="text-xs">
                            {disabled ? 'Disabled' : 'Available'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center">
              <CalendarIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Select a Date</h3>
              <p className="text-gray-600">
                Choose a date from the calendar to manage its time slots
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}