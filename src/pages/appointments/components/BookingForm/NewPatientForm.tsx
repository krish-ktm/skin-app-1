import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, Users } from 'lucide-react';
import { FormData } from '../../../../types';
import { ErrorMessage } from './ErrorMessage';
import { SubmitButton } from './SubmitButton';

interface NewPatientFormProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
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
  onBack,
  onSubmit,
  isLoading,
  errorMessage,
  selectedDate,
  selectedTime,
}: NewPatientFormProps) {
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
                className="w-full px-6 py-4 pl-12 text-base sm:text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow hover:shadow-md"
                required
                disabled={isLoading}
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={onInputChange}
                className="w-full px-6 py-4 pl-12 text-base sm:text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow hover:shadow-md"
                required
                disabled={isLoading}
              />
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <div className="relative">
              <select
                name="gender"
                value={formData.gender}
                onChange={onInputChange}
                className="w-full px-6 py-4 pl-12 text-base sm:text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow hover:shadow-md appearance-none"
                required
                disabled={isLoading}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {formData.name && formData.phone && selectedDate && selectedTime && (
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