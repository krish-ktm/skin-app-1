import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, Plus, Zap } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { DateRange, Filter as FilterType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, subDays, isValid } from 'date-fns';

interface BookingsFiltersProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filters: FilterType[];
  onFilterChange: (field: string, value: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onClearFilters: () => void;
  onAddBooking: () => void;
  onQuickAddBooking?: () => void;
  onApplyFilters: () => void;
}

export function BookingsFilters({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filters,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  onAddBooking,
  onQuickAddBooking,
  onApplyFilters
}: BookingsFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localDateRange, setLocalDateRange] = useState(dateRange);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setLocalDateRange(dateRange);
  }, [dateRange]);

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    setError(null);
    const newRange = { ...localDateRange, [field]: value };
    
    // Validate dates
    if (newRange.start && newRange.end) {
      const startDate = new Date(newRange.start);
      const endDate = new Date(newRange.end);
      
      if (!isValid(startDate) || !isValid(endDate)) {
        setError('Invalid date format');
        return;
      }
      
      if (startDate > endDate) {
        setError('Start date cannot be after end date');
        return;
      }
    }
    
    setLocalDateRange(newRange);
  };

  const handleApplyDateRange = () => {
    if (!error) {
      onDateRangeChange(localDateRange);
      setShowDatePicker(false);
    }
  };

  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = subDays(end, days - 1);
    const newRange = {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    };
    setLocalDateRange(newRange);
    onDateRangeChange(newRange);
    setShowDatePicker(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    return format(new Date(dateStr), 'MMM dd, yyyy');
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Bookings</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={onSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <Button
            onClick={onToggleFilters}
            variant="outline"
            icon={<Filter className="h-5 w-5" />}
          >
            Filters
          </Button>
          <div className="flex gap-2">
            {onQuickAddBooking && (
              <Button
                onClick={onQuickAddBooking}
                variant="primary"
                icon={<Zap className="h-5 w-5" />}
                className="bg-green-500 hover:bg-green-600"
              >
                Quick Add
              </Button>
            )}
            <Button
              onClick={onAddBooking}
              variant="primary"
              icon={<Plus className="h-5 w-5" />}
            >
              Add Booking
            </Button>
          </div>
          {(filters.length > 0 || dateRange.start || dateRange.end) && (
            <Button
              onClick={onClearFilters}
              variant="outline"
              icon={<X className="h-5 w-5" />}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4 mt-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  value={filters.find(f => f.field === 'gender')?.value || ''}
                  onChange={(e) => onFilterChange('gender', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={filters.find(f => f.field === 'status')?.value || ''}
                  onChange={(e) => onFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="missed">Missed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="relative space-y-2 col-span-2">
                <label className="block text-sm font-medium text-gray-700">Date Range</label>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <X 
                    className={`h-4 w-4 text-gray-400 transition-transform ${showDatePicker ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {showDatePicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                    >
                      <div className="space-y-4">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickSelect(7)}
                          >
                            Last 7 days
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickSelect(30)}
                          >
                            Last 30 days
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickSelect(90)}
                          >
                            Last 90 days
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-600">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={localDateRange.start}
                              onChange={(e) => handleDateChange('start', e.target.value)}
                              max={localDateRange.end}
                              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-600">
                              End Date
                            </label>
                            <input
                              type="date"
                              value={localDateRange.end}
                              onChange={(e) => handleDateChange('end', e.target.value)}
                              min={localDateRange.start}
                              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {error && (
                          <p className="text-sm text-red-600 mt-2">{error}</p>
                        )}

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setLocalDateRange({ start: '', end: '' });
                              onDateRangeChange({ start: '', end: '' });
                              setShowDatePicker(false);
                            }}
                          >
                            Clear
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleApplyDateRange}
                            disabled={!!error}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClearFilters}
              >
                Reset
              </Button>
              <Button
                onClick={onApplyFilters}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Apply Filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}