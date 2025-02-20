import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, CheckCircle2, Users } from 'lucide-react';
import { PulseLoader } from 'react-spinners';
import { FormData } from '../../../../types';
import { ErrorMessage } from './ErrorMessage';
import { SubmitButton } from './SubmitButton';

interface ReturningPatientFormProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCaseSearch: (e: React.FormEvent) => void;
  isSearchingCase: boolean;
  searchError: string | null;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  errorMessage?: string;
  selectedDate: Date | null;
  selectedTime: string;
}

export function ReturningPatientForm({
  formData,
  onInputChange,
  onCaseSearch,
  isSearchingCase,
  searchError,
  onBack,
  onSubmit,
  isLoading,
  errorMessage,
  selectedDate,
  selectedTime,
}: ReturningPatientFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 sm:p-8 rounded-2xl shadow-md border border-blue-200">
        <div className="flex items-center justify-between mb-8">
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl sm:text-2xl font-semibold text-blue-900"
          >
            Welcome Back!
          </motion.h3>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            type="button"
            onClick={onBack}
            className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors rounded-lg hover:bg-blue-50"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </motion.button>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <input
                type="text"
                name="caseId"
                value={formData.caseId}
                onChange={onInputChange}
                placeholder="Enter your Case ID"
                className="w-full px-6 py-4 text-base sm:text-lg border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow hover:shadow-md"
              />
            </div>
            <button
              type="button"
              onClick={onCaseSearch}
              disabled={isSearchingCase || !formData.caseId}
              className={`
                w-full px-8 py-4 rounded-xl font-medium text-base sm:text-lg
                flex items-center justify-center gap-3
                transition-all duration-300
                ${isSearchingCase || !formData.caseId
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-1'
                }
              `}
            >
              {isSearchingCase ? (
                <PulseLoader size={8} color="#ffffff" />
              ) : (
                <>
                  <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
          {searchError && <ErrorMessage message={searchError} />}
        </motion.div>
      </div>

      {formData.name && formData.phone && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-green-100 p-6 sm:p-8 rounded-2xl shadow-md border border-green-200"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h4 className="text-lg sm:text-xl font-semibold text-green-800">Patient Information Found</h4>
          </div>
          <div className="grid gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-700">Name</p>
              <p className="text-base sm:text-lg font-medium text-gray-900">{formData.name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-700">Phone</p>
              <p className="text-base sm:text-lg font-medium text-gray-900">{formData.phone}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-700">Gender</p>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={onInputChange}
                  className="w-full px-6 py-4 pl-12 text-base sm:text-lg border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-shadow hover:shadow-md appearance-none"
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
          </div>
        </motion.div>
      )}

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