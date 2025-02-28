import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, Calendar } from 'lucide-react';
import { FormData, ValidationErrors } from '../../../../types';
import { ErrorMessage } from './ErrorMessage';
import { SubmitButton } from './SubmitButton';
import { GenderSelect } from '../../../../components/ui/GenderSelect';

interface NewPatientFormProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  validationErrors: ValidationErrors;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  errorMessage?: string;
  selectedDate: Date | null;
  selectedTime: string;
}

export function NewPatientForm({
  formData,
  onInputChange,
  validationErrors,
  onBack,
  onSubmit,
  isLoading,
  errorMessage,
  selectedDate,
  selectedTime,
}: NewPatientFormProps) {
  const handleGenderChange = (value: string) => {
    onInputChange({
      target: { name: 'gender', value }
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 sm:p-8 rounded-2xl shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-8">
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl sm:text-2xl font-semibold text-gray-800"
          >
            New Patient Registration
          </motion.h3>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            type="button"
            onClick={onBack}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </motion.button>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6"
        >
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <div className="relative">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onInputChange}
                className={`w-full px-6 py-4 pl-12 text-base sm:text-lg border-2 ${
                  validationErrors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-xl bg-white transition-shadow hover:shadow-md`}
                required
                disabled={isLoading}
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
            </div>
            {validationErrors.name && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={onInputChange}
                className={`w-full px-6 py-4 pl-12 text-base sm:text-lg border-2 ${
                  validationErrors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-xl bg-white transition-shadow hover:shadow-md`}
                required
                disabled={isLoading}
              />
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
            </div>
            {validationErrors.phone && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.phone}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <div className="relative">
              <input
                type="number"
                name="age"
                value={formData.age || ''}
                onChange={onInputChange}
                min="1"
                max="120"
                className={`w-full px-6 py-4 pl-12 text-base sm:text-lg border-2 ${
                  validationErrors.age ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-xl bg-white transition-shadow hover:shadow-md`}
                required
                disabled={isLoading}
              />
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
            </div>
            {validationErrors.age && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.age}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <GenderSelect
              value={formData.gender}
              onChange={handleGenderChange}
              disabled={isLoading}
            />
            {validationErrors.gender && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.gender}</p>
            )}
          </div>
        </motion.div>
      </div>

      {formData.name && formData.phone && formData.age > 0 && selectedDate && selectedTime && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {errorMessage && <ErrorMessage message={errorMessage} />}
          <SubmitButton isLoading={isLoading} />
        </motion.div>
      )}
    </form>
  );
}