import React from 'react';
import { motion } from 'framer-motion';

interface GenderSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export function GenderSelect({ value, onChange, disabled = false, readOnly = false }: GenderSelectProps) {
  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => !disabled && !readOnly && onChange('male')}
        disabled={disabled || readOnly}
        className={`
          flex-1 relative py-3 px-6 rounded-lg transition-all duration-200
          ${value === 'male'
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
            : readOnly
              ? 'bg-gray-100 text-gray-500 cursor-default'
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
          }
          ${(disabled || readOnly) ? 'cursor-default' : 'cursor-pointer'}
        `}
      >
        Male
        {value === 'male' && !readOnly && (
          <motion.div
            layoutId="genderIndicator"
            className="absolute inset-0 border-2 border-blue-400 rounded-lg"
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </button>

      <button
        type="button"
        onClick={() => !disabled && !readOnly && onChange('female')}
        disabled={disabled || readOnly}
        className={`
          flex-1 relative py-3 px-6 rounded-lg transition-all duration-200
          ${value === 'female'
            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
            : readOnly
              ? 'bg-gray-100 text-gray-500 cursor-default'
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
          }
          ${(disabled || readOnly) ? 'cursor-default' : 'cursor-pointer'}
        `}
      >
        Female
        {value === 'female' && !readOnly && (
          <motion.div
            layoutId="genderIndicator"
            className="absolute inset-0 border-2 border-purple-400 rounded-lg"
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </button>
    </div>
  );
}