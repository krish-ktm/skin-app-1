import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormData } from '../../../../types';
import { PatientTypeSelection } from './PatientTypeSelection';
import { ReturningPatientForm } from './ReturningPatientForm';
import { NewPatientForm } from './NewPatientForm';

interface BookingFormProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCaseSearch: (e: React.FormEvent) => void;
  isSearchingCase: boolean;
  searchError: string | null;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  errorMessage?: string;
  isReturningPatient: boolean | null;
  setIsReturningPatient: (value: boolean | null) => void;
  selectedDate: Date | null;
  selectedTime: string;
}

export function BookingForm({
  formData,
  onInputChange,
  onCaseSearch,
  isSearchingCase,
  searchError,
  isLoading,
  onSubmit,
  errorMessage,
  isReturningPatient,
  setIsReturningPatient,
  selectedDate,
  selectedTime,
}: BookingFormProps) {
  return (
    <AnimatePresence mode="wait">
      {isReturningPatient === null ? (
        <PatientTypeSelection
          onSelect={setIsReturningPatient}
        />
      ) : isReturningPatient ? (
        <ReturningPatientForm
          formData={formData}
          onInputChange={onInputChange}
          onCaseSearch={onCaseSearch}
          isSearchingCase={isSearchingCase}
          searchError={searchError}
          onBack={() => setIsReturningPatient(null)}
          onSubmit={onSubmit}
          isLoading={isLoading}
          errorMessage={errorMessage}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
        />
      ) : (
        <NewPatientForm
          formData={formData}
          onInputChange={onInputChange}
          onBack={() => setIsReturningPatient(null)}
          onSubmit={onSubmit}
          isLoading={isLoading}
          errorMessage={errorMessage}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
        />
      )}
    </AnimatePresence>
  );
}