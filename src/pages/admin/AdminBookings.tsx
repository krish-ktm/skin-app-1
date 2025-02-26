import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PulseLoader } from 'react-spinners';
import { Search, ChevronUp, ChevronDown, Filter, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface Booking {
  id: string;
  case_id: string;
  name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  created_at: string;
  gender: string;
}

type SortField = 'case_id' | 'name' | 'phone' | 'appointment_date' | 'appointment_time';
type SortOrder = 'asc' | 'desc';

interface Filter {
  field: string;
  value: string;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<SortField>('appointment_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const itemsPerPage = 10;

  useEffect(() => {
    fetchBookings();
  }, [currentPage, searchTerm, sortField, sortOrder, filters, dateRange]);

  async function fetchBookings() {
    try {
      setIsLoading(true);
      let query = supabase
        .from('appointments')
        .select('*', { count: 'exact' });

      // Apply search
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,case_id.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      // Apply filters
      filters.forEach(filter => {
        if (filter.value) {
          query = query.ilike(filter.field, `%${filter.value}%`);
        }
      });

      // Apply date range
      if (dateRange.start) {
        query = query.gte('appointment_date', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('appointment_date', dateRange.end);
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      const { data, count, error } = await query;

      if (error) throw error;

      setBookings(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (field: string, value: string) => {
    const existingFilterIndex = filters.findIndex(f => f.field === field);
    if (existingFilterIndex >= 0) {
      const newFilters = [...filters];
      if (value) {
        newFilters[existingFilterIndex] = { field, value };
      } else {
        newFilters.splice(existingFilterIndex, 1);
      }
      setFilters(newFilters);
    } else if (value) {
      setFilters([...filters, { field, value }]);
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters([]);
    setDateRange({ start: '', end: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-500" />
      : <ChevronDown className="h-4 w-4 text-blue-500" />;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <PulseLoader color="#3B82F6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Bookings</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            icon={<Filter className="h-5 w-5" />}
          >
            Filters
          </Button>
          {(filters.length > 0 || dateRange.start || dateRange.end) && (
            <Button
              onClick={clearFilters}
              variant="outline"
              icon={<X className="h-5 w-5" />}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                value={filters.find(f => f.field === 'gender')?.value || ''}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left cursor-pointer group"
                  onClick={() => handleSort('case_id')}
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
                  onClick={() => handleSort('name')}
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
                  onClick={() => handleSort('phone')}
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
                  onClick={() => handleSort('appointment_date')}
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
                  onClick={() => handleSort('appointment_time')}
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

        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}