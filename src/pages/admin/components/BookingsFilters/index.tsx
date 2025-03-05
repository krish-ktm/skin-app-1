import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Plus, Zap, RotateCcw, ChevronDown, Users, Scale as Male, Activity } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { DateRangePicker } from '../../../../components/ui/DateRangePicker';
import type { DateRange, Filter as FilterType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface BookingsFiltersProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filters: FilterType[];
  onFilterChange: (field: string, value: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onAddBooking: () => void;
  onQuickAddBooking?: () => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const AGE_RANGES = [
  { label: 'All Ages', value: '' },
  { label: '0-18', value: '0-18' },
  { label: '19-30', value: '19-30' },
  { label: '31-45', value: '31-45' },
  { label: '46-60', value: '46-60' },
  { label: '61+', value: '61+' }
];

const GENDER_OPTIONS = [
  { label: 'All Genders', value: '' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' }
];

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Missed', value: 'missed' },
  { label: 'Cancelled', value: 'cancelled' }
];

export function BookingsFilters({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filters,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  onAddBooking,
  onQuickAddBooking,
  onApplyFilters,
  onClearFilters
}: BookingsFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localDateRange, setLocalDateRange] = useState(dateRange);
  const [showAgeRanges, setShowAgeRanges] = useState(false);
  const [showGenderOptions, setShowGenderOptions] = useState(false);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  
  useEffect(() => {
    setLocalDateRange(dateRange);
  }, [dateRange]);

  const handleDateRangeChange = (range: DateRange) => {
    setLocalDateRange(range);
  };

  const handleApplyDateRange = () => {
    onDateRangeChange(localDateRange);
    setShowDatePicker(false);
  };

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
    setShowDatePicker(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    return format(new Date(dateStr), 'MMM dd, yyyy');
  };

  const hasActiveFilters = searchTerm || filters.length > 0 || dateRange.start || dateRange.end;
  const selectedAgeRange = filters.find(f => f.field === 'age_range')?.value || '';
  const selectedGender = filters.find(f => f.field === 'gender')?.value || '';
  const selectedStatus = filters.find(f => f.field === 'status')?.value || '';

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Bookings</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0 min-w-[240px]">
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={onSearchChange}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-shadow hover:shadow-md"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onToggleFilters}
              variant="outline"
              icon={<Filter className="h-5 w-5" />}
              className={`rounded-xl border-2 transition-colors ${showFilters ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}`}
            >
              Filters
              <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            {hasActiveFilters && (
              <Button
                onClick={onClearFilters}
                variant="outline"
                icon={<RotateCcw className="h-5 w-5" />}
                className="rounded-xl text-gray-600 hover:text-gray-800"
              >
                Clear
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {onQuickAddBooking && (
              <Button
                onClick={onQuickAddBooking}
                variant="primary"
                icon={<Zap className="h-5 w-5" />}
                className="rounded-xl bg-green-500 hover:bg-green-600"
              >
                Quick Add
              </Button>
            )}
            <Button
              onClick={onAddBooking}
              variant="primary"
              icon={<Plus className="h-5 w-5" />}
              className="rounded-xl"
            >
              Add Booking
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg space-y-6 mb-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowGenderOptions(!showGenderOptions)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-left bg-white hover:bg-gray-50 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Male className="h-5 w-5 text-gray-400" />
                      {GENDER_OPTIONS.find(g => g.value === selectedGender)?.label || 'Select gender'}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showGenderOptions ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showGenderOptions && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                      >
                        {GENDER_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              onFilterChange('gender', option.value);
                              setShowGenderOptions(false);
                            }}
                            className={`
                              w-full px-4 py-3 text-left flex items-center gap-3
                              transition-colors duration-200 hover:bg-gray-50
                              ${option.value === selectedGender ? 'bg-gray-50 font-medium' : ''}
                            `}
                          >
                            <Male className={`h-5 w-5 ${option.value === selectedGender ? 'text-gray-700' : 'text-gray-400'}`} />
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStatusOptions(!showStatusOptions)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-left bg-white hover:bg-gray-50 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-gray-400" />
                      {STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label || 'Select status'}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showStatusOptions ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showStatusOptions && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              onFilterChange('status', option.value);
                              setShowStatusOptions(false);
                            }}
                            className={`
                              w-full px-4 py-3 text-left flex items-center gap-3
                              transition-colors duration-200 hover:bg-gray-50
                              ${option.value === selectedStatus ? 'bg-gray-50 font-medium' : ''}
                            `}
                          >
                            <Activity className={`h-5 w-5 ${option.value === selectedStatus ? 'text-gray-700' : 'text-gray-400'}`} />
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Age Range</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAgeRanges(!showAgeRanges)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-left bg-white hover:bg-gray-50 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-400" />
                      {AGE_RANGES.find(r => r.value === selectedAgeRange)?.label || 'Select age range'}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showAgeRanges ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showAgeRanges && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                      >
                        {AGE_RANGES.map((range) => (
                          <button
                            key={range.value}
                            type="button"
                            onClick={() => {
                              onFilterChange('age_range', range.value);
                              setShowAgeRanges(false);
                            }}
                            className={`
                              w-full px-4 py-3 text-left flex items-center gap-3
                              transition-colors duration-200 hover:bg-gray-50
                              ${range.value === selectedAgeRange ? 'bg-gray-50 font-medium' : ''}
                            `}
                          >
                            <Users className={`h-5 w-5 ${range.value === selectedAgeRange ? 'text-gray-700' : 'text-gray-400'}`} />
                            <span>{range.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="relative space-y-2 col-span-2">
                <label className="block text-sm font-medium text-gray-700">Date Range</label>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
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
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showDatePicker && (
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
                          onDateRangeChange={handleDateRangeChange}
                        />

                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowDatePicker(false)}
                            className="rounded-xl"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleApplyDateRange}
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
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={onApplyFilters}
                className="rounded-xl bg-blue-500 hover:bg-blue-600"
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