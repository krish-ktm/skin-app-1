import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../../../components/ui/Button';
import { DateRangePicker } from '../../../../components/ui/DateRangePicker';
import type { DateRange } from '../../types';

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function DateRangeFilter({
  dateRange,
  onDateRangeChange,
  isOpen,
  onToggle
}: DateRangeFilterProps) {
  const [localDateRange, setLocalDateRange] = useState(dateRange);

  useEffect(() => {
    setLocalDateRange(dateRange);
  }, [dateRange]);

  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    
    const newRange = {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    };
    
    setLocalDateRange(newRange);
    onDateRangeChange(newRange);
    onToggle();
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    return format(new Date(dateStr), 'MMM dd, yyyy');
  };

  return (
    <div className="relative space-y-2">
      <label className="block text-sm font-medium text-gray-700">Date Range</label>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
      >
        <span className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          {dateRange.start || dateRange.end ? (
            <span className="text-gray-900">
              {dateRange.start ? formatDisplayDate(dateRange.start) : 'Start'} 
              {' - '} 
              {dateRange.end ? formatDisplayDate(dateRange.end) : 'End'}
            </span>
          ) : (
            <span className="text-gray-500">Select date range</span>
          )}
        </span>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-10"
          >
            <div className="p-4">
              <div className="flex gap-3 mb-4 overflow-x-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickSelect(7)}
                  className="rounded-xl whitespace-nowrap"
                >
                  Last 7 days
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickSelect(30)}
                  className="rounded-xl whitespace-nowrap"
                >
                  Last 30 days
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickSelect(90)}
                  className="rounded-xl whitespace-nowrap"
                >
                  Last 90 days
                </Button>
              </div>

              <DateRangePicker
                dateRange={localDateRange}
                onDateRangeChange={setLocalDateRange}
              />

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onToggle}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onDateRangeChange(localDateRange);
                    onToggle();
                  }}
                  className="rounded-xl"
                >
                  Apply
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}