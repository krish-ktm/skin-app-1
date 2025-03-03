import React, { useState } from 'react';
import { Search, Filter, X, Calendar, Plus, Zap } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { DateRange, Filter as FilterType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

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
  onApplyFilters?: () => void;
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
  const hasActiveFilters = filters.length > 0 || dateRange.start || dateRange.end;
  
  // Local state to track filter changes before applying
  const [pendingFilters, setPendingFilters] = useState<FilterType[]>(filters);
  const [pendingDateRange, setPendingDateRange] = useState<DateRange>(dateRange);
  
  // Initialize local state when filters prop changes
  React.useEffect(() => {
    setPendingFilters(filters);
  }, [filters]);
  
  React.useEffect(() => {
    setPendingDateRange(dateRange);
  }, [dateRange]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleLocalFilterChange = (field: string, value: string) => {
    const existingFilterIndex = pendingFilters.findIndex(f => f.field === field);
    if (existingFilterIndex >= 0) {
      const newFilters = [...pendingFilters];
      if (value) {
        newFilters[existingFilterIndex] = { field, value };
      } else {
        newFilters.splice(existingFilterIndex, 1);
      }
      setPendingFilters(newFilters);
    } else if (value) {
      setPendingFilters([...pendingFilters, { field, value }]);
    }
  };
  
  const handleLocalDateRangeChange = (range: DateRange) => {
    setPendingDateRange(range);
  };
  
  const handleApplyFilters = () => {
    // Apply all pending filters at once
    pendingFilters.forEach(filter => {
      onFilterChange(filter.field, filter.value);
    });
    
    // Apply date range
    onDateRangeChange(pendingDateRange);
    
    // Close date picker if open
    setShowDatePicker(false);
    
    // Call the parent's apply filters function if provided
    if (onApplyFilters) {
      onApplyFilters();
    }
  };
  
  const handleClearLocalFilters = () => {
    setPendingFilters([]);
    setPendingDateRange({ start: '', end: '' });
    setShowDatePicker(false);
    onClearFilters();
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
          {hasActiveFilters && (
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
                  value={pendingFilters.find(f => f.field === 'gender')?.value || ''}
                  onChange={(e) => handleLocalFilterChange('gender', e.target.value)}
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
                  value={pendingFilters.find(f => f.field === 'status')?.value || ''}
                  onChange={(e) => handleLocalFilterChange('status', e.target.value)}
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
                    {pendingDateRange.start || pendingDateRange.end ? (
                      <span className="text-gray-900">
                        {pendingDateRange.start ? formatDate(pendingDateRange.start) : 'Start'} 
                        {' - '} 
                        {pendingDateRange.end ? formatDate(pendingDateRange.end) : 'End'}
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-600">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={pendingDateRange.start}
                            onChange={(e) => handleLocalDateRangeChange({ ...pendingDateRange, start: e.target.value })}
                            max={pendingDateRange.end}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-600">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={pendingDateRange.end}
                            onChange={(e) => handleLocalDateRangeChange({ ...pendingDateRange, end: e.target.value })}
                            min={pendingDateRange.start}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-4 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleLocalDateRangeChange({ start: '', end: '' });
                          }}
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setShowDatePicker(false)}
                        >
                          Done
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleClearLocalFilters}
              >
                Reset
              </Button>
              <Button
                onClick={handleApplyFilters}
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