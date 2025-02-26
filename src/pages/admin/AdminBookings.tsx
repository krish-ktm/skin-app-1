import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PulseLoader } from 'react-spinners';
import { BookingsFilters } from './components/BookingsFilters';
import { BookingsTable } from './components/BookingsTable';
import { BookingsPagination } from './components/BookingsPagination';
import type { Booking, SortField, SortOrder, Filter, DateRange } from './types';

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<SortField>('appointment_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    // Apply filters, sorting, and pagination on the client side
    let filteredData = [...allBookings];

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredData = filteredData.filter(booking => 
        booking.name.toLowerCase().includes(searchLower) ||
        booking.case_id.toLowerCase().includes(searchLower) ||
        booking.phone.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    filters.forEach(filter => {
      if (filter.value) {
        if (filter.field === 'gender') {
          // Exact match for gender
          filteredData = filteredData.filter(booking =>
            booking[filter.field as keyof Booking].toLowerCase() === filter.value.toLowerCase()
          );
        } else {
          // Contains match for other fields
          const filterLower = filter.value.toLowerCase();
          filteredData = filteredData.filter(booking =>
            String(booking[filter.field as keyof Booking]).toLowerCase().includes(filterLower)
          );
        }
      }
    });

    // Apply date range
    if (dateRange.start) {
      filteredData = filteredData.filter(booking => 
        booking.appointment_date >= dateRange.start
      );
    }
    if (dateRange.end) {
      filteredData = filteredData.filter(booking => 
        booking.appointment_date <= dateRange.end
      );
    }

    // Apply sorting
    filteredData.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    // Update total pages
    setTotalPages(Math.ceil(filteredData.length / itemsPerPage));

    // Apply pagination
    const start = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(start, start + itemsPerPage);
    setBookings(paginatedData);
  }, [allBookings, currentPage, searchTerm, sortField, sortOrder, filters, dateRange]);

  async function fetchBookings() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAllBookings(data || []);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <PulseLoader color="#3B82F6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BookingsFilters
        searchTerm={searchTerm}
        onSearchChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filters={filters}
        onFilterChange={handleFilterChange}
        dateRange={dateRange}
        onDateRangeChange={(range) => {
          setDateRange(range);
          setCurrentPage(1);
        }}
        onClearFilters={clearFilters}
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <BookingsTable
          bookings={bookings}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        />

        <BookingsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}