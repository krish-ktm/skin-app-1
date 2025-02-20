import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { Calendar } from '../Calendar';
import { TimeSlots } from '../TimeSlots';
import { BookingForm } from '../BookingForm';
import { BookingConfirmation } from '../BookingConfirmation';
import { useAppointmentBooking } from '../../hooks/useAppointmentBooking';
import { useAppointmentForm } from '../../hooks/useAppointmentForm';
import { useAppointmentSlots } from '../../hooks/useAppointmentSlots';
import { useNotification } from '../../hooks/useNotification';
import { useCalendar } from './useCalendar';
import { pageTransition } from '../../../../utils/animations';

export default function AppointmentBooking() {
  const [isReturningPatient, setIsReturningPatient] = useState<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const {
    currentDate,
    selectedDate,
    handlePrevMonth,
    handleNextMonth,
    handleDateSelect,
    isDateDisabled
  } = useCalendar();

  const {
    formData,
    isSearchingCase,
    searchError,
    handleInputChange,
    handleCaseSearch
  } = useAppointmentForm();

  const {
    availableSlots,
    isFetchingSlots,
    fetchBookingCounts
  } = useAppointmentSlots();

  const {
    showNotification,
    notificationMessage,
    notificationType,
    showTemporaryNotification
  } = useNotification();

  const [selectedTime, setSelectedTime] = useState<string>('');

  const {
    bookingStatus,
    setBookingStatus,
    isLoading,
    handleSubmit
  } = useAppointmentBooking(
    formData,
    selectedDate,
    selectedTime,
    () => showTemporaryNotification('Appointment booked successfully!', 'success'),
    (error) => showTemporaryNotification(error, 'error')
  );

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
      setIsInitialized(true);
    };
    signIn();
  }, []);

  // Initialize with today's date and fetch initial slots
  useEffect(() => {
    if (isInitialized && selectedDate) {
      fetchBookingCounts(selectedDate);
    }
  }, [isInitialized, selectedDate, fetchBookingCounts]);

  // Subscribe to real-time updates for appointments
  useEffect(() => {
    if (!isInitialized) return;

    const subscription = supabase
      .channel('appointments-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'appointments' 
      }, payload => {
        if (selectedDate) {
          fetchBookingCounts(selectedDate);
          showTemporaryNotification('A new booking has been made. Time slots updated.', 'info');
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedDate, isInitialized, fetchBookingCounts, showTemporaryNotification]);

  return (
    <div className="p-3 sm:p-6 bg-white rounded-2xl shadow-xl">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Book an Appointment</h2>
      
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              notificationType === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <div className="flex items-center gap-2">
              {notificationType === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <p className={`text-sm ${
                notificationType === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {notificationMessage}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {bookingStatus.success && bookingStatus.appointment ? (
          <motion.div
            key="confirmation"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageTransition}
          >
            <BookingConfirmation
              appointment={bookingStatus.appointment}
              onBookAnother={() => {
                setBookingStatus({});
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setSelectedDate(today);
                setIsReturningPatient(null);
                setFormData({ name: '', phone: '', caseId: '' });
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="booking-form"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageTransition}
            className="space-y-6"
          >
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
              isReturningPatient={isReturningPatient}
              setIsReturningPatient={setIsReturningPatient}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}