import React from 'react';
import { useAdminBookings } from './useAdminBookings';
import { BookingsFilters } from '../BookingsFilters';
import { BookingsTable } from '../BookingsTable';
import { BookingsPagination } from '../BookingsPagination';
import { BookingModal } from '../BookingModal';
import { QuickBookingModal } from '../QuickBookingModal';
import { ConfirmationModal } from '../ConfirmationModal';
import { NotificationToast } from './NotificationToast';
import { LoadingOverlay } from './LoadingOverlay';

export default function AdminBookings() {
  const {
    bookings,
    isLoading,
    searchTerm,
    currentPage,
    totalPages,
    totalCount,
    sortField,
    sortOrder,
    showFilters,
    filters,
    dateRange,
    showBookingModal,
    showQuickBookingModal,
    currentBooking,
    showDeleteModal,
    isDeleting,
    notification,
    actionInProgress,
    itemsPerPage,
    handleSort,
    handleFilterChange,
    handleDateRangeChange,
    handleAddBooking,
    handleQuickAddBooking,
    handleCloseQuickBookingModal,
    handleEditBooking,
    handleDeleteBooking,
    confirmDeleteBooking,
    handleSaveBooking,
    handleStatusChange,
    handleSearchChange,
    setShowBookingModal,
    setShowDeleteModal,
    setShowFilters,
    setCurrentPage,
    applyFilters,
    clearFilters
  } = useAdminBookings();

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
        onAddBooking={handleAddBooking}
        onQuickAddBooking={handleQuickAddBooking}
        onApplyFilters={applyFilters}
        onClearFilters={clearFilters}
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden relative">
        <LoadingOverlay 
          actionInProgress={actionInProgress} 
          isLoading={isLoading} 
        />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="mt-4 text-gray-500 text-sm">Loading bookings...</p>
            </div>
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
              isLoading={false}
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

      <QuickBookingModal
        isOpen={showQuickBookingModal}
        onClose={handleCloseQuickBookingModal}
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