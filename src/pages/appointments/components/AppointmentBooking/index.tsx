import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppointmentBooking } from './hooks/useAppointmentBooking';
import { PatientTypeSelection } from './components/PatientTypeSelection';
import { ReturningPatientForm } from './components/ReturningPatientForm';
import { NewPatientForm } from './components/NewPatientForm';
import { BookingConfirmation } from '../BookingConfirmation';
import { Calendar } from '../Calendar';
import { TimeSlots } from '../TimeSlots';
import { pageTransition } from '../../../../utils/animations';

export default function AppointmentBooking() {
  const {
    currentDate,
    selectedDate,
    selectedTime,
    formData,
    bookingStatus,
    availableSlots,
    isLoading,
    isFetchingSlots,
    isSearchingCase,
    searchError,
    showNotification,
    notificationMessage,
    notificationType,
    isReturningPatient,
    handleDateSelect,
    handlePrevMonth,
    handleNextMonth,
    handleInputChange,
    handleCaseSearch,
    handleSubmit,
    setIsReturningPatient,
    setBookingStatus,
    setFormData,
    isDateDisabled,
  } = useAppointmentBooking();

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

            {isReturningPatient === null ? (
              <PatientTypeSelection
                onSelect={setIsReturningPatient}
              />
            ) : isReturningPatient ? (
              <ReturningPatientForm
                formData={formData}
                onInputChange={handleInputChange}
                onCaseSearch={handleCaseSearch}
                isSearchingCase={isSearchingCase}
                searchError={searchError}
                onBack={() => setIsReturningPatient(null)}
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
                onBack={() => setIsReturningPatient(null)}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                errorMessage={bookingStatus.message}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}