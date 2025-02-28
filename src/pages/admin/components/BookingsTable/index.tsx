import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Edit, Trash2, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';
import type { Booking, SortField } from '../../types';
import { Button } from '../../../../components/ui/Button';
import { formatTimeSlot } from '../../../../utils/date';
import { PulseLoader } from 'react-spinners';

interface BookingsTableProps {
  bookings: Booking[];
  sortField: SortField;
  sortOrder: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
  onStatusChange: (booking: Booking, status: 'scheduled' | 'completed' | 'missed' | 'cancelled') => void;
  isLoading: boolean;
}

export function BookingsTable({ 
  bookings, 
  sortField, 
  sortOrder, 
  onSort, 
  onEdit, 
  onDelete,
  onStatusChange,
  isLoading
}: BookingsTableProps) {
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-500" />
      : <ChevronDown className="h-4 w-4 text-blue-500" />;
  };

  const getStatusBadgeClass = (status?: string) => {
    switch(status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'scheduled':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch(status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'missed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'scheduled':
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const toggleStatusDropdown = (bookingId: string) => {
    setOpenStatusDropdown(openStatusDropdown === bookingId ? null : bookingId);
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Age
            </th>
            <th 
              className="px-6 py-3 text-left cursor-pointer group"
              onClick={() => onSort('status')}
            >
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </span>
                {renderSortIcon('status')}
              </div>
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isLoading && bookings.length > 0 && (
            <tr>
              <td colSpan={9} className="px-6 py-4">
                <div className="flex justify-center">
                  <PulseLoader size={8} color="#3B82F6" />
                </div>
              </td>
            </tr>
          )}
          {!isLoading && bookings.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                No bookings found
              </td>
            </tr>
          ) : (
            bookings.map((booking) => (
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
                  {formatTimeSlot(booking.appointment_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {booking.gender}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {booking.age || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="relative">
                    <button
                      onClick={() => toggleStatusDropdown(booking.id)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(booking.status)}`}
                    >
                      {getStatusIcon(booking.status)}
                      <span className="ml-1 capitalize">{booking.status || 'scheduled'}</span>
                      <ChevronRight className={`ml-1 h-3 w-3 transition-transform ${openStatusDropdown === booking.id ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {/* Status dropdown - now controlled by click instead of hover */}
                    {openStatusDropdown === booking.id && (
                      <div className="absolute left-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <div className="py-1">
                          <button 
                            onClick={() => {
                              onStatusChange(booking, 'scheduled');
                              setOpenStatusDropdown(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                          >
                            <Clock className="h-4 w-4 mr-2 text-blue-500" />
                            Scheduled
                          </button>
                          <button 
                            onClick={() => {
                              onStatusChange(booking, 'completed');
                              setOpenStatusDropdown(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                          >
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            Completed
                          </button>
                          <button 
                            onClick={() => {
                              onStatusChange(booking, 'missed');
                              setOpenStatusDropdown(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                          >
                            <XCircle className="h-4 w-4 mr-2 text-red-500" />
                            Missed
                          </button>
                          <button 
                            onClick={() => {
                              onStatusChange(booking, 'cancelled');
                              setOpenStatusDropdown(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                          >
                            <XCircle className="h-4 w-4 mr-2 text-gray-500" />
                            Cancelled
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(booking)}
                      icon={<Edit className="h-4 w-4 text-blue-500" />}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(booking)}
                      icon={<Trash2 className="h-4 w-4 text-red-500" />}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}