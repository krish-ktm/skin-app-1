import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, Phone, Users } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { GenderSelect } from '../../../../components/ui/GenderSelect';
import { TimeSlots } from '../TimeSlots';
import { CalendarPicker } from './CalendarPicker';
import { supabase } from '../../../../lib/supabase';
import type { Booking } from '../../types';
import { nanoid } from 'nanoid';
import { isTimeSlotExpired } from '../../../../utils/date';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Partial<Booking>) => Promise<void>;
  booking?: Booking;
  title: string;
}

export function BookingModal({ isOpen, onClose, onSave, booking, title }: BookingModalProps) {
  const [formData, setFormData] = useState<Partial<Booking>>({
    name: '',
    phone: '',
    appointment_date: '',
    appointment_time: '',
    gender: 'male',
    age: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ time: string; available: boolean; bookingCount?: number }[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [timeSlotsError, setTimeSlotsError] = useState<string | null>(null);

  useEffect(() => {
    if (booking) {
      setFormData({
        ...booking
      });
    } else {
      // Generate a new case ID for new bookings
      setFormData({
        name: '',
        phone: '',
        appointment_date: '',
        appointment_time: '',
        gender: 'male',
        age: 0,
        case_id: nanoid(6).toUpperCase().replace(/[^A-Z0-9]/g, '')
      });
    }
  }, [booking, isOpen]);

  useEffect(() => {
    if (formData.appointment_date) {
      fetchTimeSlots(formData.appointment_date);
    }
  }, [formData.appointment_date]);

  const fetchTimeSlots = async (date: string) => {
    setIsLoadingTimeSlots(true);
    setTimeSlotsError(null);
    try {
      // Get appointments for the date
      const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('appointment_time, id')
        .eq('appointment_date', date);

      if (aptError) throw aptError;

      // Get disabled slots for the date
      const { data: disabledSlots, error: disabledError } = await supabase
        .from('time_slot_settings')
        .select('time, is_disabled')
        .eq('date', date)
        .eq('is_disabled', true);

      if (disabledError) throw disabledError;

      // Check if the entire day is disabled
      const isDayDisabled = disabledSlots?.some(slot => slot.time === null);
      
      if (isDayDisabled) {
        setAvailableTimeSlots([]);
        throw new Error('This day is not available for bookings');
      }

      // Generate time slots from 9 AM to 11 PM with 30-minute intervals
      const slots = [];
      for (let hour = 9; hour < 23; hour++) {
        // Add both :00 and :30 slots for each hour
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          available: true
        });
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:30`,
          available: true
        });
      }
      // Add the last slot at 11 PM
      slots.push({
        time: `23:00`,
        available: true
      });

      // Count bookings for each time slot
      const counts: { [key: string]: number } = {};
      appointments?.forEach(apt => {
        // Skip counting the current booking when editing
        if (booking && apt.id === booking.id) return;
        
        counts[apt.appointment_time] = (counts[apt.appointment_time] || 0) + 1;
      });

      // Create a date object for the selected date to check expired time slots
      const selectedDate = new Date(date);
      
      // Update available slots
      const updatedSlots = slots.map(slot => {
        const isDisabled = disabledSlots?.some(ds => ds.time === slot.time);
        const isExpired = isTimeSlotExpired(slot.time, selectedDate);
        
        return {
          ...slot,
          bookingCount: counts[slot.time] || 0,
          available: !isDisabled && !isExpired && (counts[slot.time] || 0) < 4
        };
      });

      setAvailableTimeSlots(updatedSlots);
      
      // If editing and the current time slot is expired, don't reset it
      // This allows admins to keep the original time slot when editing past appointments
      if (booking && formData.appointment_time) {
        const currentTimeSlot = updatedSlots.find(slot => slot.time === formData.appointment_time);
        if (currentTimeSlot && !currentTimeSlot.available) {
          // Add the current time slot as a special case for this edit
          const specialSlot = {
            ...currentTimeSlot,
            available: true,
            isOriginalSlot: true
          };
          
          // Find the index of the current time slot
          const index = updatedSlots.findIndex(slot => slot.time === formData.appointment_time);
          
          // Replace the slot with our special version
          if (index !== -1) {
            const newSlots = [...updatedSlots];
            newSlots[index] = specialSlot;
            setAvailableTimeSlots(newSlots);
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching time slots:', error);
      setTimeSlotsError(error.message);
      setAvailableTimeSlots([]);
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle age as a number
    if (name === 'age') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear validation errors when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, appointment_date: date }));
    if (errors.appointment_date) {
      setErrors(prev => ({ ...prev, appointment_date: '' }));
    }
  };

  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }));
    if (errors.gender) {
      setErrors(prev => ({ ...prev, gender: '' }));
    }
  };

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({ ...prev, appointment_time: time }));
    if (errors.appointment_time) {
      setErrors(prev => ({ ...prev, appointment_time: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.appointment_date) {
      newErrors.appointment_date = 'Date is required';
    }
    
    if (!formData.appointment_time) {
      newErrors.appointment_time = 'Time is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      // When editing, only include the fields that should be updatable
      const updatedData: Partial<Booking> = {
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time
      };

      // If it's a new booking, include all fields
      if (!booking) {
        updatedData.name = formData.name;
        updatedData.phone = formData.phone;
        updatedData.gender = formData.gender;
        updatedData.age = formData.age;
        updatedData.case_id = formData.case_id;
      }

      await onSave(updatedData);
      onClose();
    } catch (error: any) {
      console.error('Error saving booking:', error);
      setErrors({ submit: error.message || 'Failed to save booking' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.submit && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    {errors.submit}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Read-only fields for user information when editing */}
                  {booking ? (
                    <>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                          {booking.name}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                          {booking.phone}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Gender</label>
                        <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 capitalize">
                          {booking.gender}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Age</label>
                        <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                          {booking.age}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Input
                        label="Name"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        error={errors.name}
                        icon={<User className="h-5 w-5" />}
                        required
                      />
                      
                      <Input
                        label="Phone"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        error={errors.phone}
                        icon={<Phone className="h-5 w-5" />}
                        required
                      />
                      
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Gender</label>
                        <GenderSelect
                          value={formData.gender || 'male'}
                          onChange={handleGenderChange}
                        />
                        {errors.gender && (
                          <p className="text-sm text-red-600">{errors.gender}</p>
                        )}
                      </div>
                      
                      <Input
                        label="Age"
                        type="number"
                        name="age"
                        value={formData.age?.toString() || '0'}
                        onChange={handleChange}
                        error={errors.age}
                        icon={<Users className="h-5 w-5" />}
                        min="0"
                        required
                      />
                    </>
                  )}
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <CalendarPicker
                      selectedDate={formData.appointment_date || ''}
                      onDateChange={handleDateChange}
                      minDate={new Date().toISOString().split('T')[0]}
                    />
                    {errors.appointment_date && (
                      <p className="text-sm text-red-600">{errors.appointment_date}</p>
                    )}
                  </div>
                  
                  {booking && (
                    <Input
                      label="Case ID"
                      name="case_id"
                      value={formData.case_id || ''}
                      readOnly
                      className="bg-gray-50"
                    />
                  )}
                </div>

                {/* Time Slots Selection */}
                <div className="mt-4">
                  {formData.appointment_date ? (
                    <TimeSlots
                      slots={availableTimeSlots}
                      selectedTime={formData.appointment_time || ''}
                      onTimeSelect={handleTimeSelect}
                      isLoading={isLoadingTimeSlots}
                      error={timeSlotsError}
                      isEditing={!!booking}
                    />
                  ) : (
                    <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                      Please select a date to view available time slots
                    </div>
                  )}
                  {errors.appointment_time && (
                    <p className="text-sm text-red-600 mt-1">{errors.appointment_time}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                  >
                    {booking ? 'Update Booking' : 'Create Booking'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}