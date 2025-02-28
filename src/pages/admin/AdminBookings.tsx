import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PulseLoader } from 'react-spinners';
import { BookingsFilters } from './components/BookingsFilters';
import { BookingsTable } from './components/BookingsTable';
import { BookingsPagination } from './components/BookingsPagination';
import { BookingModal } from './components/BookingModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import type { Booking, SortField, SortOrder, Filter, DateRange } from './types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Booking | undefined>(undefined);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  
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
        if (filter.field === 'gender' || filter.field === 'status') {
          // Exact match for gender and status
          filteredData = filteredData.filter(booking =>
            booking[filter.field as keyof Booking]?.toLowerCase() === filter.value.toLowerCase()
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
      showNotification('Failed to fetch bookings', 'error');
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

  const handleAddBooking = () => {
    setCurrentBooking(undefined);
    setShowBookingModal(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setCurrentBooking(booking);
    setShowBookingModal(true);
  };

  const handleDeleteBooking = (booking: Booking) => {
    setCurrentBooking(booking);
    setShowDeleteModal(true);
  };

  const confirmDeleteBooking = async () => {
    if (!currentBooking) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', currentBooking.id);

      if (error) throw error;
      
      await fetchBookings();
      setShowDeleteModal(false);
      showNotification('Booking deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting booking:', error);
      showNotification('Failed to delete booking', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveBooking = async (booking: Partial<Booking>) => {
    try {
      if (currentBooking) {
        // Update existing booking
        const { error } = await supabase
          .from('appointments')
          .update(booking)
          .eq('id', currentBooking.id);

        if (error) throw error;
        
        showNotification('Booking updated successfully', 'success');
      } else {
        // Create new booking
        const { error } = await supabase
          .from('appointments')
          .insert(booking);

        if (error) throw error;
        
        showNotification('Booking created successfully', 'success');
      }
      
      await fetchBookings();
    } catch (error) {
      console.error('Error saving booking:', error);
      throw error;
    }
  };

  const handleStatusChange = async (booking: Booking, status: 'scheduled' | 'completed' | 'missed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', booking.id);

      if (error) throw error;
      
      await fetchBookings();
      showNotification(`Booking marked as ${status}`, 'success');
    } catch (error) {
      console.error('Error updating booking status:', error);
      showNotification('Failed to update booking status', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  if (isLoading && allBookings.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <PulseLoader color="#3B82F6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <p className={`text-sm ${
                notification.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {notification.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        onAddBooking={handleAddBooking}
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <BookingsTable
          bookings={bookings}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          onEdit={handleEditBooking}
          onDelete={handleDeleteBooking}
          onStatusChange={handleStatusChange}
        />

        <BookingsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSave={handleSaveBooking}
        booking={currentBooking}
        title={currentBooking ? 'Edit Booking' : 'Add New Booking'}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteBooking}
        title="Delete Booking"
        message={`Are you sure you want to delete the booking for ${currentBooking?.name}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}