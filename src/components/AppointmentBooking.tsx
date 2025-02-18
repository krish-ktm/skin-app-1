import React, { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { supabase } from '../lib/supabase';
import { Calendar } from './Calendar';
import { TimeSlots, type TimeSlot } from './TimeSlots';
import { BookingForm } from './BookingForm';
import { BookingConfirmation } from './BookingConfirmation';

const initialTimeSlots: TimeSlot[] = [
  { time: '09:00', available: true },
  { time: '10:00', available: true },
  { time: '11:00', available: false },
  { time: '12:00', available: true },
  { time: '14:00', available: true },
  { time: '15:00', available: true },
  { time: '16:00', available: false },
  { time: '17:00', available: true },
];

type Appointment = {
  case_id: string;
  name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
};

export default function AppointmentBooking() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    caseId: '',
  });
  const [bookingStatus, setBookingStatus] = useState<{
    success?: boolean;
    message?: string;
    appointment?: Appointment;
  }>({});
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>(initialTimeSlots);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isSearchingCase, setIsSearchingCase] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Auto sign in for demo purposes
  useEffect(() => {
    const signIn = async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'demo@example.com',
        password: 'demo123',
      });
      if (error) {
        await supabase.auth.signUp({
          email: 'demo@example.com',
          password: 'demo123',
        });
      }
    };
    signIn();
  }, []);

  // Initialize with today's date and fetch initial slots
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  // Fetch booking counts for selected date
  const fetchBookingCounts = async (date: Date) => {
    setIsFetchingSlots(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('appointment_date', dateStr);

      if (error) {
        console.error('Error fetching appointments:', error);
        return;
      }

      // Count bookings for each time slot
      const counts: { [key: string]: number } = {};
      appointments?.forEach(apt => {
        counts[apt.appointment_time] = (counts[apt.appointment_time] || 0) + 1;
      });

      // Update available slots
      const updatedSlots = initialTimeSlots.map(slot => ({
        ...slot,
        bookingCount: counts[slot.time] || 0,
        available: slot.available && (counts[slot.time] || 0) < 4
      }));

      setAvailableSlots(updatedSlots);
    } finally {
      setIsFetchingSlots(false);
    }
  };

  // Fetch slots when selected date changes
  useEffect(() => {
    if (selectedDate) {
      fetchBookingCounts(selectedDate);
    }
  }, [selectedDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'caseId') {
      setSearchError(null);
    }
  };

  const handleCaseSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caseId) return;

    setIsSearchingCase(true);
    setSearchError(null);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('case_id', formData.caseId.toUpperCase())
        .maybeSingle();

      if (error) {
        throw new Error('Error searching for appointment');
      }

      if (!data) {
        throw new Error('No appointment found with this Case ID');
      }

      setFormData(prev => ({
        ...prev,
        name: data.name,
        phone: data.phone,
      }));
    } catch (error: any) {
      setSearchError(error.message);
    } finally {
      setIsSearchingCase(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      setBookingStatus({
        success: false,
        message: 'Please select both date and time for your appointment',
      });
      return;
    }

    setIsLoading(true);
    const caseId = nanoid(10).toUpperCase();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check current booking count
      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data: existingBookings } = await supabase
        .from('appointments')
        .select('id')
        .eq('appointment_date', dateStr)
        .eq('appointment_time', selectedTime);

      if (existingBookings && existingBookings.length >= 4) {
        throw new Error('This time slot is now full. Please select another time.');
      }

      const appointment: Appointment = {
        case_id: caseId,
        name: formData.name,
        phone: formData.phone,
        appointment_date: dateStr,
        appointment_time: selectedTime,
      };

      const { error } = await supabase
        .from('appointments')
        .insert({ ...appointment, user_id: user.id });

      if (error) throw error;

      setBookingStatus({
        success: true,
        message: 'Appointment booked successfully!',
        appointment,
      });

      // Reset form
      setFormData({ name: '', phone: '', caseId: '' });
      setSelectedDate(null);
      setSelectedTime('');
    } catch (error: any) {
      setBookingStatus({
        success: false,
        message: error.message || 'Failed to book appointment. Please try again.',
      });
      console.error('Booking error:', error);
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
      setSelectedTime(''); // Reset selected time when date changes
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 bg-white rounded-2xl shadow-xl">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Book an Appointment</h2>
      
      {bookingStatus.success && bookingStatus.appointment ? (
        <BookingConfirmation
          appointment={bookingStatus.appointment}
          onBookAnother={() => setBookingStatus({})}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <Calendar
              currentDate={currentDate}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              isDateDisabled={isDateDisabled}
            />
            
            <TimeSlots
              slots={availableSlots}
              selectedTime={selectedTime}
              onTimeSelect={setSelectedTime}
              isLoading={isFetchingSlots}
            />
          </div>

          <BookingForm
            formData={formData}
            onInputChange={handleInputChange}
            onCaseSearch={handleCaseSearch}
            isSearchingCase={isSearchingCase}
            searchError={searchError}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            errorMessage={bookingStatus.message}
          />
        </div>
      )}
    </div>
  );
}