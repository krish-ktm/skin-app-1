import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { nanoid } from 'nanoid';
import { PulseLoader } from 'react-spinners';
import { supabase } from '../lib/supabase';

type TimeSlot = {
  time: string;
  available: boolean;
  bookingCount?: number;
};

type Appointment = {
  case_id: string;
  name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
};

const timeSlots: TimeSlot[] = [
  { time: '09:00', available: true },
  { time: '10:00', available: true },
  { time: '11:00', available: false },
  { time: '12:00', available: true },
  { time: '14:00', available: true },
  { time: '15:00', available: true },
  { time: '16:00', available: false },
  { time: '17:00', available: true },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function AppointmentBooking() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
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
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>(timeSlots);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isSearchingCase, setIsSearchingCase] = useState(false);

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

  // Fetch booking counts for selected date
  useEffect(() => {
    const fetchBookingCounts = async () => {
      if (!selectedDate) return;

      setIsFetchingSlots(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
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
        appointments.forEach(apt => {
          counts[apt.appointment_time] = (counts[apt.appointment_time] || 0) + 1;
        });

        // Update available slots
        const updatedSlots = timeSlots.map(slot => ({
          ...slot,
          bookingCount: counts[slot.time] || 0,
          available: slot.available && (counts[slot.time] || 0) < 4
        }));

        setAvailableSlots(updatedSlots);
      } finally {
        setIsFetchingSlots(false);
      }
    };

    fetchBookingCounts();
  }, [selectedDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCaseSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caseId) return;

    setIsSearchingCase(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('case_id', formData.caseId.toUpperCase())
        .single();

      if (error) {
        throw new Error('No appointment found with this Case ID');
      }

      if (data) {
        setFormData(prev => ({
          ...prev,
          name: data.name,
          phone: data.phone,
        }));
      }
    } catch (error: any) {
      setBookingStatus({
        success: false,
        message: error.message,
      });
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days: (number | null)[] = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
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
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  React.useEffect(() => {
    const today = new Date();
    if (currentDate.getMonth() !== today.getMonth() || currentDate.getFullYear() !== today.getFullYear()) {
      setCurrentDate(today);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Book an Appointment</h2>
      
      {bookingStatus.success ? (
        <div className="text-center p-6 bg-green-50 rounded-lg">
          <h3 className="text-xl font-semibold text-green-800 mb-4">Booking Confirmed!</h3>
          <div className="space-y-3 text-left max-w-md mx-auto bg-white p-4 rounded-lg border border-green-200">
            <p className="font-mono bg-green-100 p-2 rounded">
              Case ID: {bookingStatus.appointment?.case_id}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-gray-600">Name:</p>
              <p className="font-medium">{bookingStatus.appointment?.name}</p>
              <p className="text-gray-600">Phone:</p>
              <p className="font-medium">{bookingStatus.appointment?.phone}</p>
              <p className="text-gray-600">Date:</p>
              <p className="font-medium">
                {new Date(bookingStatus.appointment?.appointment_date || '').toLocaleDateString()}
              </p>
              <p className="text-gray-600">Time:</p>
              <p className="font-medium">{bookingStatus.appointment?.appointment_time}</p>
            </div>
          </div>
          <button
            onClick={() => setBookingStatus({})}
            className="mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Book Another Appointment
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Case ID Search */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Returning Patient?</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  name="caseId"
                  value={formData.caseId}
                  onChange={handleInputChange}
                  placeholder="Enter your Case ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={handleCaseSearch}
                disabled={isSearchingCase || !formData.caseId}
                className={`
                  px-4 py-2 rounded-lg font-medium
                  flex items-center gap-2
                  ${isSearchingCase || !formData.caseId
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }
                `}
              >
                {isSearchingCase ? (
                  <PulseLoader size={8} color="#ffffff" />
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Select Date (Next 3 Days Only)</label>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-600 py-1">
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth(currentDate).map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      disabled={day === null || (day && isDateDisabled(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)))}
                      onClick={() => day && handleDateSelect(day)}
                      className={`
                        p-2 text-sm rounded-lg
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
                  <div className="mt-4 text-sm text-gray-600">
                    Selected: {formatDate(selectedDate)}
                  </div>
                )}
              </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Time
                {isFetchingSlots && (
                  <span className="ml-2 inline-block">
                    <PulseLoader size={4} color="#3B82F6" />
                  </span>
                )}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available || isFetchingSlots}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium
                      ${selectedTime === slot.time
                        ? 'bg-blue-500 text-white'
                        : slot.available && !isFetchingSlots
                          ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {slot.time}
                      </div>
                      {slot.bookingCount !== undefined && (
                        <span className="text-xs">
                          {4 - slot.bookingCount} slots left
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={isLoading}
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={isLoading}
                />
                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {bookingStatus.message && !bookingStatus.success && (
            <div className="text-red-600 text-sm">{bookingStatus.message}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full py-3 px-6 rounded-lg font-medium
              transition-colors duration-200
              ${isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
              }
              text-white
              flex items-center justify-center
            `}
          >
            {isLoading ? (
              <>
                <PulseLoader size={8} color="#ffffff" className="mr-2" />
                <span>Booking Appointment...</span>
              </>
            ) : (
              'Book Appointment'
            )}
          </button>
        </form>
      )}
    </div>
  );
}