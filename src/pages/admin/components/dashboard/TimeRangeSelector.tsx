import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';

export type TimeRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

export function TimeRangeSelector({ selectedRange, onChange, className = '' }: TimeRangeSelectorProps) {
  const ranges: { value: TimeRange; label: string; icon?: React.ReactNode }[] = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '6m', label: '6 Months' },
    { value: '1y', label: '1 Year' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className={`flex items-center space-x-2 bg-gray-100 p-1 rounded-lg ${className}`}>
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedRange === range.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}

export function getTimeRangeDate(range: TimeRange): Date {
  const now = new Date();
  
  switch (range) {
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '30d':
      return new Date(now.setDate(now.getDate() - 30));
    case '90d':
      return new Date(now.setDate(now.getDate() - 90));
    case '6m':
      return new Date(now.setMonth(now.getMonth() - 6));
    case '1y':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case 'all':
      return new Date(2020, 0, 1); // A date far in the past
    default:
      return new Date(now.setDate(now.getDate() - 30));
  }
}