import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, CheckCircle2, RotateCcw } from 'lucide-react';
import { PulseLoader } from 'react-spinners';
import { FormData, ValidationErrors } from '../../../../types';
import { ErrorMessage } from './ErrorMessage';
import { SubmitButton } from './SubmitButton';
import { GenderSelect } from '../../../../components/ui/GenderSelect';

interface ReturningPatientFormProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCaseSearch: (e: React.FormEvent) => void;
  isSearchingCase: boolean;
  searchError: string | null;
  validationErrors: ValidationErrors;
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
  validationErrors,
  onBack,
  onSubmit,
  isLoading,
  errorMessage,
  selectedDate,
  selectedTime,
}: ReturningPatientFormProps) {
  const patientFound = formData.name && formData.phone;

  const handleSearchAnother = () => {
    onInputChange({
      target: { name: 'caseId', value: '' }
    } as React.ChangeEvent<HTMLInputElement>);
    onInputChange({
      target: { name: 'name', value: '' }
    } as React.ChangeEvent<HTMLInputElement>);
    onInputChange({
      target: { name: 'phone', value: '' }
    } as React.ChangeEvent<HTMLInputElement>);
    onInputChange({
      target: { name: 'gender', value: 'male' }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className={`bg-gradient-to-br ${patientFound ? 'from-green-50 to-green-100 border-green-200' : 'from-blue-50 to-blue-100 border-blue-200'} p-6 sm:p-8 rounded-2xl shadow-md border`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-xl sm:text-2xl font-semibold ${patientFound ? 'text-green-900' : 'text-blue-900'}`}
          >
            {patientFound ? 'Welcome Back!' : 'Find Your Case'}
          </motion.h3>
          <div className="flex items-center gap-2">
            {patientFound && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                type="button"
                onClick={handleSearchAnother}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Search Another
              </motion.button>
            )}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              type="button"
              onClick={onBack}
              className={`flex items-center px-4 py-2 ${patientFound ? 'text-green-600 hover:text-green-800 hover:bg-green-50' : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'} transition-colors rounded-lg`}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </motion.button>
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {!patientFound ? (
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  name="caseId"
                  value={formData.caseId}
                  onChange={onInputChange}
                  placeholder="Enter your Case ID"
                  className={`w-full px-6 py-4 text-base sm:text-lg border-2 ${
                    searchError || validationErrors.caseId ? 'border-red-200' : 'border-blue-200'
                  } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow hover:shadow-md`}
                />
                {validationErrors.caseId && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.caseId}</p>
                )}
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
              {searchError && <ErrorMessage message={searchError} />}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-semibold text-green-800">Patient Found</h4>
                  <p className="text-sm text-green-600">Case ID: {formData.caseId}</p>
                </div>
              </div>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700">Name</p>
                  <p className="text-base sm:text-lg font-medium text-gray-900 bg-white px-4 py-3 rounded-lg border border-green-100">
                    {formData.name}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700">Phone</p>
                  <p className="text-base sm:text-lg font-medium text-gray-900 bg-white px-4 py-3 rounded-lg border border-green-100">
                    {formData.phone}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700">Gender</p>
                  <div className="bg-white rounded-lg border border-green-100 p-2">
                    <GenderSelect
                      value={formData.gender}
                      onChange={() => {}}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {patientFound && selectedDate && selectedTime && (
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