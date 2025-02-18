import React from 'react';
import { Search, User, Phone } from 'lucide-react';
import { PulseLoader } from 'react-spinners';

interface BookingFormProps {
  formData: {
    name: string;
    phone: string;
    caseId: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCaseSearch: (e: React.FormEvent) => void;
  isSearchingCase: boolean;
  searchError: string | null;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  errorMessage?: string;
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
}: BookingFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Returning Patient */}
      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
        <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-3">Returning Patient?</h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1">
            <input
              type="text"
              name="caseId"
              value={formData.caseId}
              onChange={onInputChange}
              placeholder="Enter your Case ID"
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={onCaseSearch}
            disabled={isSearchingCase || !formData.caseId}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm sm:text-base
              flex items-center justify-center gap-2
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
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>
        {searchError && (
          <p className="mt-2 text-xs sm:text-sm text-red-600">{searchError}</p>
        )}
      </div>

      {/* Personal Information */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <div className="relative">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              className="w-full px-3 sm:px-4 py-2 pl-8 sm:pl-10 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
            <User className="absolute left-2 sm:left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <div className="relative">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={onInputChange}
              className="w-full px-3 sm:px-4 py-2 pl-8 sm:pl-10 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
            <Phone className="absolute left-2 sm:left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="text-red-600 text-xs sm:text-sm">{errorMessage}</div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={`
          w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-medium text-sm sm:text-base
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
  );
}