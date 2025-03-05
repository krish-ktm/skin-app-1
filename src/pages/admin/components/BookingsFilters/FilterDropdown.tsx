import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label: string;
  options: Option[];
  selectedValue: string;
  onSelect: (value: string) => void;
  icon: LucideIcon;
  isOpen: boolean;
  onToggle: () => void;
  placeholder?: string;
  maxHeight?: string;
}

export function FilterDropdown({
  label,
  options,
  selectedValue,
  onSelect,
  icon: Icon,
  isOpen,
  onToggle,
  placeholder = 'Select option',
  maxHeight = 'auto'
}: FilterDropdownProps) {
  const selectedOption = options.find(opt => opt.value === selectedValue);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-left bg-white hover:bg-gray-50 flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-gray-400" />
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-y-auto`}
              style={{ maxHeight }}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onSelect(option.value);
                    onToggle();
                  }}
                  className={`
                    w-full px-4 py-3 text-left flex items-center gap-3
                    transition-colors duration-200 hover:bg-gray-50
                    ${option.value === selectedValue ? 'bg-gray-50 font-medium' : ''}
                  `}
                >
                  <Icon className={`h-5 w-5 ${option.value === selectedValue ? 'text-gray-700' : 'text-gray-400'}`} />
                  <span>{option.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}