import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, UserPlus } from 'lucide-react';
import { containerVariants, itemVariants } from './animations';

interface PatientTypeSelectionProps {
  onSelect: (isReturning: boolean) => void;
}

export function PatientTypeSelection({ onSelect }: PatientTypeSelectionProps) {
  const [selectedCard, setSelectedCard] = useState<'returning' | 'new' | null>(null);

  const handleCardSelection = (type: 'returning' | 'new') => {
    setSelectedCard(type);
    setTimeout(() => {
      onSelect(type === 'returning');
      setSelectedCard(null);
    }, 400);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col items-center space-y-6 w-full"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        <motion.button
          variants={itemVariants}
          type="button"
          onClick={() => handleCardSelection('returning')}
          className={`
            group p-6 sm:p-8 bg-white rounded-xl sm:rounded-2xl transition-all duration-300
            ${selectedCard === 'returning' 
              ? 'scale-95 border-4 border-blue-500 shadow-lg' 
              : 'border-2 border-blue-100 hover:border-blue-500 hover:shadow-xl'
            }
            flex flex-col items-center space-y-4
          `}
        >
          <div className="transform group-hover:scale-110 transition-transform duration-300">
            <div className="p-4 sm:p-5 bg-blue-50 rounded-full group-hover:bg-blue-100">
              <UserCheck className="w-8 h-8 sm:w-12 sm:h-12 text-blue-500" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h4 className="text-xl sm:text-2xl font-semibold text-gray-800">Returning Patient</h4>
            <p className="text-base sm:text-lg text-gray-600">Quick access with your Case ID</p>
          </div>
        </motion.button>

        <motion.button
          variants={itemVariants}
          type="button"
          onClick={() => handleCardSelection('new')}
          className={`
            group p-6 sm:p-8 bg-white rounded-xl sm:rounded-2xl transition-all duration-300
            ${selectedCard === 'new' 
              ? 'scale-95 border-4 border-green-500 shadow-lg' 
              : 'border-2 border-green-100 hover:border-green-500 hover:shadow-xl'
            }
            flex flex-col items-center space-y-4
          `}
        >
          <div className="transform group-hover:scale-110 transition-transform duration-300">
            <div className="p-4 sm:p-5 bg-green-50 rounded-full group-hover:bg-green-100">
              <UserPlus className="w-8 h-8 sm:w-12 sm:h-12 text-green-500" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h4 className="text-xl sm:text-2xl font-semibold text-gray-800">New Patient</h4>
            <p className="text-base sm:text-lg text-gray-600">Start your journey with us</p>
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}