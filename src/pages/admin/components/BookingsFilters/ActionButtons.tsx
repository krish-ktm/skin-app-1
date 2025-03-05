import React from 'react';
import { Plus, Zap, Filter, RotateCcw } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface ActionButtonsProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onQuickAdd?: () => void;
  onAddBooking: () => void;
}

export function ActionButtons({
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  onClearFilters,
  onQuickAdd,
  onAddBooking
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
      <div className="flex gap-2">
        <Button
          onClick={onToggleFilters}
          variant="outline"
          icon={<Filter className="h-5 w-5" />}
          className={`rounded-xl border-2 transition-colors ${showFilters ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}`}
        >
          Filters
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
        {onQuickAdd && (
          <Button
            onClick={onQuickAdd}
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
  );
}