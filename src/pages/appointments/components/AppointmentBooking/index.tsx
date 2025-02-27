import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { Calendar } from '../Calendar';
import { TimeSlots } from '../TimeSlots';
import { BookingForm } from '../BookingForm';
import { ErrorMessage } from '../BookingForm/ErrorMessage';
import { PatientTypeSelection } from '../BookingForm/PatientTypeSelection';
import { ReturningPatientForm } from '../BookingForm/ReturningPatientForm';
import { NewPatientForm } from '../BookingForm/NewPatientForm';
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
    setSelectedDate,
    handlePrevMonth,
    handleNextMonth,
    handleDateSelect,
    isDateDisabled
  } = useCalendar();

  const {
    formData,
    setFormData,
    isSearchingCase,
    searchError,
    handleInputChange,
    handleCaseSearch,
    resetFormData
  } = useAppointmentForm();

  const {
    availableSlots,
    isFetchingSlots,
    error: slotsError,
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

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isInitialized) return;

    const subscription = supabase
      .channel('any')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'appointments' 
      }, () => {
        if (selectedDate) {
          fetchBookingCounts(selectedDate);
          showTemporaryNotification('Booking information updated', 'info');
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'time_slot_settings'
      }, () => {
        if (selectedDate) {
          fetchBookingCounts(selectedDate);
          showTemporaryNotification('Time slot availability updated', 'info');
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedDate, isInitialized, fetchBookingCounts, showTemporaryNotification]);

  // Reset selected time when date changes or when slots are updated
  useEffect(() => {
    setSelectedTime('');
  }, [selectedDate, availableSlots]);

  // Handle patient type selection with form data reset
  const handlePatientTypeSelection = (isReturning: boolean | null) => {
    resetFormData();
    setIsReturningPatient(isReturning);
  };

  return (
    <div className="p-3 sm:p-6 bg-white rounded-2xl shadow-xl">
      {!bookingStatus.success && (
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Book an Appointment</h2>
      )}
      
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
            <div className="text-center p-6 sm:p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 p-4 rounded-full">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">Booking Confirmed!</h3>
              <p className="text-green-600 mb-8">Your appointment has been successfully scheduled</p>
              
              <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-md border border-green-200">
                <div className="space-y-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="font-mono text-sm sm:text-base text-green-800">
                      Case ID: {bookingStatus.appointment.case_id}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{bookingStatus.appointment.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{bookingStatus.appointment.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium text-gray-900 capitalize">{bookingStatus.appointment.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(bookingStatus.appointment.appointment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium text-gray-900">{bookingStatus.appointment.appointment_time}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                error={slotsError}
              />
            </div>

            <AnimatePresence mode="wait">
              {isReturningPatient === null ? (
                <PatientTypeSelection
                  onSelect={handlePatientTypeSelection}
                />
              ) : isReturningPatient ? (
                <ReturningPatientForm
                  formData={formData}
                  onInputChange={handleInputChange}
                  onCaseSearch={handleCaseSearch}
                  isSearchingCase={isSearchingCase}
                  searchError={searchError}
                  onBack={() => handlePatientTypeSelection(null)}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  errorMessage={bookingStatus.message}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                />
              ) : (
                <NewPatientForm
                  formData={formData}
                  onInputChange={handleInputChange}
                  onBack={() => handlePatientTypeSelection(null)}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  errorMessage={bookingStatus.message}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}