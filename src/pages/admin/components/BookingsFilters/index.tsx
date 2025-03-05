import React, { useState } from 'react';
import { Scale as Male, Activity, Users, Clock } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import type { DateRange, Filter as FilterType } from '../../types';
import { SearchBar } from './SearchBar';
import { ActionButtons } from './ActionButtons';
import { FilterDropdown } from './FilterDropdown';
import { DateRangeFilter } from './DateRangeFilter';
import { AGE_RANGES, GENDER_OPTIONS, STATUS_OPTIONS, TIME_SLOTS } from './constants';

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
  const [showGenderOptions, setShowGenderOptions] = useState(false);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [showAgeRanges, setShowAgeRanges] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const hasActiveFilters = searchTerm || filters.length > 0 || dateRange.start || dateRange.end;
  const selectedGender = filters.find(f => f.field === 'gender')?.value || '';
  const selectedStatus = filters.find(f => f.field === 'status')?.value || '';
  const selectedAgeRange = filters.find(f => f.field === 'age_range')?.value || '';
  const selectedTimeSlot = filters.find(f => f.field === 'appointment_time')?.value || '';

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Bookings</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <SearchBar value={searchTerm} onChange={onSearchChange} />
          <ActionButtons
            showFilters={showFilters}
            onToggleFilters={onToggleFilters}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
            onQuickAdd={onQuickAddBooking}
            onAddBooking={onAddBooking}
          />
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
              <FilterDropdown
                label="Gender"
                options={GENDER_OPTIONS}
                selectedValue={selectedGender}
                onSelect={(value) => onFilterChange('gender', value)}
                icon={Male}
                isOpen={showGenderOptions}
                onToggle={() => setShowGenderOptions(!showGenderOptions)}
                placeholder="Select gender"
              />

              <FilterDropdown
                label="Status"
                options={STATUS_OPTIONS}
                selectedValue={selectedStatus}
                onSelect={(value) => onFilterChange('status', value)}
                icon={Activity}
                isOpen={showStatusOptions}
                onToggle={() => setShowStatusOptions(!showStatusOptions)}
                placeholder="Select status"
              />

              <FilterDropdown
                label="Age Range"
                options={AGE_RANGES}
                selectedValue={selectedAgeRange}
                onSelect={(value) => onFilterChange('age_range', value)}
                icon={Users}
                isOpen={showAgeRanges}
                onToggle={() => setShowAgeRanges(!showAgeRanges)}
                placeholder="Select age range"
              />

              <FilterDropdown
                label="Time Slot"
                options={[{ label: 'All Times', value: '' }, ...TIME_SLOTS]}
                selectedValue={selectedTimeSlot}
                onSelect={(value) => onFilterChange('appointment_time', value)}
                icon={Clock}
                isOpen={showTimeSlots}
                onToggle={() => setShowTimeSlots(!showTimeSlots)}
                placeholder="Select time"
                maxHeight="240px"
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <DateRangeFilter
                dateRange={dateRange}
                onDateRangeChange={onDateRangeChange}
                isOpen={showDatePicker}
                onToggle={() => setShowDatePicker(!showDatePicker)}
              />
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