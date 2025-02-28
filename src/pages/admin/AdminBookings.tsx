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
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState<SortField>('appointment_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Booking | undefined>(undefined);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const itemsPerPage = 100; // Increased from 10 to 100

  useEffect(() => {
    fetchBookings();
  }, [currentPage, searchTerm, sortField, sortOrder, filters, dateRange]);

  async function fetchBookings() {
    try {
      setIsLoading(isInitialLoad);
      
      // Start building the query
      let query = supabase
        .from('appointments')
        .select('*', { count: 'exact' });
      
      // Apply search if provided
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,case_id.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }
      
      // Apply filters
      filters.forEach(filter => {
        if (filter.value) {
          if (filter.field === 'gender' || filter.field === 'status') {
            // Exact match for gender and status
            query = query.eq(filter.field, filter.value.toLowerCase());
          } else {
            // Contains match for other fields
            query = query.ilike(filter.field, `%${filter.value}%`);
          }
        }
      });
      
      // Apply date range
      if (dateRange.start) {
        query = query.gte('appointment_date', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('appointment_date', dateRange.end);
      }
      
      // Get total count first
      const { count, error: countError } = await query;
      
      if (countError) {
        console.error('Count error details:', countError);
        throw countError;
      }
      
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      
      // Apply sorting and pagination
      query = query
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showNotification('Failed to fetch bookings', 'error');
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
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
    setCurrentPage(1); // Reset to first page when filters change
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
      // Optimistically update UI
      setBookings(prevBookings => prevBookings.filter(b => b.id !== currentBooking.id));
      
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', currentBooking.id);

      if (error) {
        console.error('Delete error details:', error);
        // Revert optimistic update on error
        await fetchBookings();
        throw error;
      }
      
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
        console.log('Updating booking:', booking);
        
        // Optimistically update UI
        setBookings(prevBookings => 
          prevBookings.map(b => b.id === currentBooking.id ? { ...b, ...booking } : b)
        );
        
        const { data, error } = await supabase
          .from('appointments')
          .update(booking)
          .eq('id', currentBooking.id)
          .select();

        if (error) {
          console.error('Update error details:', error);
          // Revert optimistic update on error
          await fetchBookings();
          throw error;
        }
        
        console.log('Update response:', data);
        showNotification('Booking updated successfully', 'success');
      } else {
        // Create new booking
        console.log('Creating booking:', booking);
        const { data, error } = await supabase
          .from('appointments')
          .insert(booking)
          .select();

        if (error) {
          console.error('Insert error details:', error);
          throw error;
        }
        
        console.log('Insert response:', data);
        
        // Add the new booking to the list if it belongs on the current page
        if (data && data.length > 0) {
          const newBooking = data[0] as Booking;
          setBookings(prevBookings => [newBooking, ...prevBookings]);
        }
        
        showNotification('Booking created successfully', 'success');
      }
      
      setShowBookingModal(false);
    } catch (error) {
      console.error('Error saving booking:', error);
      throw error;
    }
  };

  const handleStatusChange = async (booking: Booking, status: 'scheduled' | 'completed' | 'missed' | 'cancelled') => {
    try {
      console.log('Changing status:', booking.id, status);
      
      // Optimistically update UI
      setBookings(prevBookings => 
        prevBookings.map(b => b.id === booking.id ? { ...b, status } : b)
      );
      
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', booking.id)
        .select();

      if (error) {
        console.error('Status update error details:', error);
        // Revert optimistic update on error
        await fetchBookings();
        throw error;
      }
      
      console.log('Status update response:', data);
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
        {isLoading && bookings.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <PulseLoader color="#3B82F6" />
          </div>
        ) : (
          <>
            <BookingsTable
              bookings={bookings}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              onEdit={handleEditBooking}
              onDelete={handleDeleteBooking}
              onStatusChange={handleStatusChange}
              isLoading={isLoading}
            />

            <BookingsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}
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