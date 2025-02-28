import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, Phone, Users } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { GenderSelect } from '../../../../components/ui/GenderSelect';
import type { Booking } from '../../types';
import { nanoid } from 'nanoid';

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
    age: 0,
    status: 'scheduled'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        status: 'scheduled',
        case_id: nanoid(6).toUpperCase().replace(/[^A-Z0-9]/g, '')
      });
    }
  }, [booking, isOpen]);

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
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    
    if (!formData.appointment_date) {
      newErrors.appointment_date = 'Date is required';
    }
    
    if (!formData.appointment_time) {
      newErrors.appointment_time = 'Time is required';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    if (formData.age === undefined || formData.age < 0) {
      newErrors.age = 'Age must be a positive number';
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
                  
                  <Input
                    label="Date"
                    type="date"
                    name="appointment_date"
                    value={formData.appointment_date || ''}
                    onChange={handleChange}
                    error={errors.appointment_date}
                    icon={<Calendar className="h-5 w-5" />}
                    required
                  />
                  
                  <Input
                    label="Time"
                    type="time"
                    name="appointment_time"
                    value={formData.appointment_time || ''}
                    onChange={handleChange}
                    error={errors.appointment_time}
                    icon={<Clock className="h-5 w-5" />}
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
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="status"
                      value={formData.status || 'scheduled'}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="missed">Missed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
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