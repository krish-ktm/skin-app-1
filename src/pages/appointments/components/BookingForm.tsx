import React, { useState } from 'react';
import { Search, User, Phone, ArrowLeft, UserPlus, UserCheck, CheckCircle2 } from 'lucide-react';
import { PulseLoader } from 'react-spinners';
import { motion, AnimatePresence } from 'framer-motion';

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

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

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
  const [isReturningPatient, setIsReturningPatient] = useState<boolean | null>(null);
  const [selectedCard, setSelectedCard] = useState<'returning' | 'new' | null>(null);

  const handleCardSelection = (type: 'returning' | 'new') => {
    setSelectedCard(type);
    setTimeout(() => {
      setIsReturningPatient(type === 'returning');
      setSelectedCard(null);
    }, 400);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <AnimatePresence mode="wait">
        {/* Patient Type Selection */}
        {isReturningPatient === null && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center space-y-6"
          >
            <motion.h3 
              variants={itemVariants}
              className="text-xl sm:text-2xl font-semibold text-gray-800 text-center"
            >
              Welcome to Our Appointment System
              <span className="block text-sm sm:text-base text-gray-600 mt-2">
                Please select how you'd like to proceed
              </span>
            </motion.h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl">
              <motion.button
                variants={itemVariants}
                type="button"
                onClick={() => handleCardSelection('returning')}
                className={`
                  group p-4 sm:p-8 bg-white rounded-xl sm:rounded-2xl transition-all duration-300
                  ${selectedCard === 'returning' 
                    ? 'scale-95 border-4 border-blue-500 shadow-lg' 
                    : 'border-2 border-blue-100 hover:border-blue-500 hover:shadow-xl'
                  }
                  flex flex-col items-center space-y-3 sm:space-y-6
                `}
              >
                <div className="transform group-hover:scale-110 transition-transform duration-300">
                  <div className="p-3 sm:p-5 bg-blue-50 rounded-full group-hover:bg-blue-100">
                    <UserCheck className="w-8 h-8 sm:w-12 sm:h-12 text-blue-500" />
                  </div>
                </div>
                <div className="text-center space-y-1 sm:space-y-2">
                  <h4 className="text-lg sm:text-xl font-semibold text-gray-800">Returning Patient</h4>
                  <p className="text-sm sm:text-base text-gray-600">Quick access with your Case ID</p>
                </div>
              </motion.button>

              <motion.button
                variants={itemVariants}
                type="button"
                onClick={() => handleCardSelection('new')}
                className={`
                  group p-4 sm:p-8 bg-white rounded-xl sm:rounded-2xl transition-all duration-300
                  ${selectedCard === 'new' 
                    ? 'scale-95 border-4 border-green-500 shadow-lg' 
                    : 'border-2 border-green-100 hover:border-green-500 hover:shadow-xl'
                  }
                  flex flex-col items-center space-y-3 sm:space-y-6
                `}
              >
                <div className="transform group-hover:scale-110 transition-transform duration-300">
                  <div className="p-3 sm:p-5 bg-green-50 rounded-full group-hover:bg-green-100">
                    <UserPlus className="w-8 h-8 sm:w-12 sm:h-12 text-green-500" />
                  </div>
                </div>
                <div className="text-center space-y-1 sm:space-y-2">
                  <h4 className="text-lg sm:text-xl font-semibold text-gray-800">New Patient</h4>
                  <p className="text-sm sm:text-base text-gray-600">Start your journey with us</p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Returning Patient Form */}
        {isReturningPatient === true && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-md border border-blue-200">
              <div className="flex items-center justify-between mb-8">
                <motion.h3 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-semibold text-blue-900"
                >
                  Welcome Back!
                </motion.h3>
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  type="button"
                  onClick={() => setIsReturningPatient(null)}
                  className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors rounded-lg hover:bg-blue-50"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </motion.button>
              </div>
              
              <motion.div 
                variants={itemVariants}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      name="caseId"
                      value={formData.caseId}
                      onChange={onInputChange}
                      placeholder="Enter your Case ID"
                      className="w-full px-6 py-4 text-lg border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow hover:shadow-md"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onCaseSearch}
                    disabled={isSearchingCase || !formData.caseId}
                    className={`
                      px-8 py-4 rounded-xl font-medium text-lg
                      flex items-center justify-center gap-3 min-w-[160px]
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
                        <Search className="w-6 h-6" />
                        <span>Search</span>
                      </>
                    )}
                  </button>
                </div>
                {searchError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <p className="text-sm text-red-600">{searchError}</p>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {formData.name && formData.phone && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-md border border-green-200"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="text-xl font-semibold text-green-800">Patient Information Found</h4>
                </div>
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-700">Name</p>
                    <p className="text-lg font-medium text-gray-900">{formData.name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-700">Phone</p>
                    <p className="text-lg font-medium text-gray-900">{formData.phone}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* New Patient Form */}
        {isReturningPatient === false && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl shadow-md border border-gray-200">
              <div className="flex items-center justify-between mb-8">
                <motion.h3 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-semibold text-gray-800"
                >
                  New Patient Registration
                </motion.h3>
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  type="button"
                  onClick={() => setIsReturningPatient(null)}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-200"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </motion.button>
              </div>
              
              <motion.div 
                variants={itemVariants}
                className="grid md:grid-cols-2 gap-8"
              >
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={onInputChange}
                      className="w-full px-6 py-4 pl-12 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow hover:shadow-md"
                      required
                      disabled={isLoading}
                    />
                    <User className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
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
                      className="w-full px-6 py-4 pl-12 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow hover:shadow-md"
                      required
                      disabled={isLoading}
                    />
                    <Phone className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(isReturningPatient === true && formData.name && formData.phone) || isReturningPatient === false ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-red-50 border border-red-200 rounded-xl"
            >
              <p className="text-sm text-red-600">{errorMessage}</p>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full py-5 px-8 rounded-xl font-medium text-xl
              transition-all duration-300
              ${isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-1'
              }
              text-white
              flex items-center justify-center
            `}
          >
            {isLoading ? (
              <>
                <PulseLoader size={10} color="#ffffff" className="mr-3" />
                <span>Booking Appointment...</span>
              </>
            ) : (
              'Book Appointment'
            )}
          </button>
        </motion.div>
      ) : null}
    </form>
  );
}