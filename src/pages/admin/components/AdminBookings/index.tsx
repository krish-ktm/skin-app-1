import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useBookings } from './hooks/useBookings';
import { useNotification } from './hooks/useNotification';
import { BookingsFilters } from './components/BookingsFilters';
import { BookingsTable } from './components/BookingsTable';
import { BookingsPagination } from './components/BookingsPagination';
import { BookingModal } from './components/BookingModal';
import { QuickBookingModal } from './components/QuickBookingModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { NotificationToast } from './components/NotificationToast';
import { LoadingOverlay } from './components/LoadingOverlay';
import type { Booking } from '../../types';

export default function AdminBookings() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showQuickBookingModal, setShowQuickBookingModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Booking | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    bookings,
    isLoading,
    currentPage,
    totalPages,
    totalCount,
    sortField,
    sortOrder,
    searchTerm,
    showFilters,
    filters,
    dateRange,
    actionInProgress,
    handleSort,
    handleSearchChange,
    handleFilterChange,
    handleDateRangeChange,
    clearFilters,
    applyFilters,
    fetchBookings,
    setCurrentPage,
    setShowFilters,
  } = useBookings();

  const {
    notification,
    showNotification
  } = useNotification();

  useEffect(() => {
    fetchBookings();
  }, [currentPage, sortField, sortOrder]);

  const handleAddBooking = () => {
    setCurrentBooking(undefined);
    setShowBookingModal(true);
  };

  const handleQuickAddBooking = () => {
    setShowQuickBookingModal(true);
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
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      showNotification('Failed to delete booking', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveBooking = async (booking: Partial<Booking>) => {
    try {
      if (currentBooking) {
        const { error } = await supabase
          .from('appointments')
          .update(booking)
          .eq('id', currentBooking.id);

        if (error) throw error;
        showNotification('Booking updated successfully', 'success');
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert(booking);

        if (error) throw error;
        showNotification('Booking created successfully', 'success');
      }
      
      await fetchBookings();
      setShowBookingModal(false);
      setShowQuickBookingModal(false);
    } catch (error: any) {
      console.error('Error saving booking:', error);
      showNotification('Failed to save booking', 'error');
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

  return (
    <div className="space-y-6">
      <NotificationToast notification={notification} />

      <BookingsFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filters={filters}
        onFilterChange={handleFilterChange}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onClearFilters={clearFilters}
        onAddBooking={handleAddBooking}
        onQuickAddBooking={handleQuickAddBooking}
        onApplyFilters={applyFilters}
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden relative">
        <LoadingOverlay 
          isLoading={isLoading && !isInitialLoad} 
          actionInProgress={actionInProgress} 
        />

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
          itemsPerPage={100}
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

      <QuickBookingModal
        isOpen={showQuickBookingModal}
        onClose={() => setShowQuickBookingModal(false)}
        onSave={handleSaveBooking}
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