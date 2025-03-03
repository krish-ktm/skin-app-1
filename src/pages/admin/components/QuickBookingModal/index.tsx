import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, Phone, Users, Zap, AlertCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { GenderSelect } from '../../../../components/ui/GenderSelect';
import { supabase } from '../../../../lib/supabase';
import type { Booking } from '../../types';
import { nanoid } from 'nanoid';
import { PulseLoader } from 'react-spinners';
import { format, addDays } from 'date-fns';

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Partial<Booking>) => Promise<void>;
}

interface NextAvailableSlot {
  date: Date;
  time: string;
  isLoading: boolean;
  error: string | null;
}

export function QuickBookingModal({ isOpen, onClose, onSave }: QuickBookingModalProps) {
  const [formData, setFormData] = useState<Partial<Booking>>({
    name: '',
    phone: '',
    gender: 'male',
    age: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nextAvailableSlot, setNextAvailableSlot] = useState<NextAvailableSlot>({
    date: new Date(),
    time: '',
    isLoading: false,
    error: null
  });

  useEffect(() => {
    if (isOpen) {
      resetForm();
      findNextAvailableSlot();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      gender: 'male',
      age: 0,
      case_id: nanoid(6).toUpperCase().replace(/[^A-Z0-9]/g, '')
    });
    setErrors({});
  };

  const findNextAvailableSlot = async () => {
    setNextAvailableSlot(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Start with today and look for the next 7 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let foundSlot = false;
      let currentDate = today;
      let availableDate: Date | null = null;
      let availableTime: string | null = null;
      
      // Look for the next 7 days
      for (let i = 0; i < 7 && !foundSlot; i++) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        
        // Check if the day is disabled
        const { data: disabledDay, error: dayError } = await supabase
          .from('time_slot_settings')
          .select('*')
          .is('time', null)
          .eq('is_disabled', true)
          .eq('date', dateStr);
          
        if (dayError) throw dayError;
        
        // If the day is not disabled, check for available time slots
        if (!disabledDay || disabledDay.length === 0) {
          // Get disabled time slots
          const { data: disabledSlots, error: slotsError } = await supabase
            .from('time_slot_settings')
            .select('time')
            .eq('is_disabled', true)
            .eq('date', dateStr);
            
          if (slotsError) throw slotsError;
          
          // Get existing bookings for this date
          const { data: bookings, error: bookingsError } = await supabase
            .from('appointments')
            .select('appointment_time, id')
            .eq('appointment_date', dateStr);
            
          if (bookingsError) throw bookingsError;
          
          // Generate all possible time slots (9 AM to 11 PM)
          const allTimeSlots = [];
          for (let hour = 9; hour < 23; hour++) {
            allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
            allTimeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
          }
          allTimeSlots.push('23:00');
          
          // Count bookings per time slot
          const bookingCounts: Record<string, number> = {};
          bookings?.forEach(booking => {
            bookingCounts[booking.appointment_time] = (bookingCounts[booking.appointment_time] || 0) + 1;
          });
          
          // Find the first available time slot
          for (const time of allTimeSlots) {
            // Skip if time slot is disabled
            if (disabledSlots?.some(slot => slot.time === time)) continue;
            
            // Skip if time slot is in the past for today
            if (i === 0) {
              const now = new Date();
              const [hours, minutes] = time.split(':').map(Number);
              const slotTime = new Date(today);
              slotTime.setHours(hours, minutes, 0, 0);
              if (slotTime <= now) continue;
            }
            
            // Skip if time slot is full (4 or more bookings)
            if ((bookingCounts[time] || 0) >= 4) continue;
            
            // Found an available slot
            availableDate = currentDate;
            availableTime = time;
            foundSlot = true;
            break;
          }
        }
        
        // Move to next day if no slot found
        if (!foundSlot) {
          currentDate = addDays(currentDate, 1);
        }
      }
      
      if (foundSlot && availableDate && availableTime) {
        setNextAvailableSlot({
          date: availableDate,
          time: availableTime,
          isLoading: false,
          error: null
        });
        
        // Update form data with the found date and time
        setFormData(prev => ({
          ...prev,
          appointment_date: format(availableDate, 'yyyy-MM-dd'),
          appointment_time: availableTime
        }));
      } else {
        setNextAvailableSlot({
          date: today,
          time: '',
          isLoading: false,
          error: 'No available slots found in the next 7 days'
        });
      }
    } catch (error: any) {
      console.error('Error finding next available slot:', error);
      setNextAvailableSlot({
        date: new Date(),
        time: '',
        isLoading: false,
        error: error.message || 'Failed to find available slots'
      });
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

  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }));
    if (errors.gender) {
      setErrors(prev => ({ ...prev, gender: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone || formData.phone.trim() === '') {
      newErrors.phone = 'Phone is required';
    }
    
    if (!formData.age || formData.age <= 0) {
      newErrors.age = 'Age must be greater than 0';
    }
    
    if (!formData.appointment_date || !formData.appointment_time) {
      newErrors.slot = 'No available slot found';
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
      await onSave(formData);
      onClose();
    } catch (error: any) {
      console.error('Error saving booking:', error);
      setErrors({ submit: error.message || 'Failed to save booking' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeSlot = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
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
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-gray-900">Quick Booking</h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Next Available Slot
                  </span>
                </div>
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
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-6">
                  <h4 className="text-lg font-medium text-green-800 mb-2 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Next Available Slot
                  </h4>
                  
                  {nextAvailableSlot.isLoading ? (
                    <div className="flex justify-center py-4">
                      <PulseLoader size={8} color="#16a34a" />
                    </div>
                  ) : nextAvailableSlot.error ? (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <p>{nextAvailableSlot.error}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {format(nextAvailableSlot.date, 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600">Time</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {formatTimeSlot(nextAvailableSlot.time)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  
                  <Input
                    label="Case ID (Auto-generated)"
                    name="case_id"
                    value={formData.case_id || ''}
                    readOnly
                    className="bg-gray-50"
                  />
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
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Quick Book
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