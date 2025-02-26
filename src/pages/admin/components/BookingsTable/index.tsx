import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { Booking, SortField } from '../../types';

interface BookingsTableProps {
  bookings: Booking[];
  sortField: SortField;
  sortOrder: 'asc' | 'desc';
  onSort: (field: SortField) => void;
}

export function BookingsTable({ bookings, sortField, sortOrder, onSort }: BookingsTableProps) {
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-500" />
      : <ChevronDown className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              className="px-6 py-3 text-left cursor-pointer group"
              onClick={() => onSort('case_id')}
            >
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case ID
                </span>
                {renderSortIcon('case_id')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left cursor-pointer group"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </span>
                {renderSortIcon('name')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left cursor-pointer group"
              onClick={() => onSort('phone')}
            >
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </span>
                {renderSortIcon('phone')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left cursor-pointer group"
              onClick={() => onSort('appointment_date')}
            >
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </span>
                {renderSortIcon('appointment_date')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left cursor-pointer group"
              onClick={() => onSort('appointment_time')}
            >
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </span>
                {renderSortIcon('appointment_time')}
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gender
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {booking.case_id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {booking.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {booking.phone}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(booking.appointment_date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {booking.appointment_time}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                {booking.gender}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}