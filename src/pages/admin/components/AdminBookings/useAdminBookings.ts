import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import type { Booking, SortField, SortOrder, Filter, DateRange } from '../../types';

export function useAdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [showQuickBookingModal, setShowQuickBookingModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Booking | undefined>(undefined);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<{
    type: 'fetch' | 'delete' | 'update' | 'create';
    message: string;
  } | null>(null);
  
  const itemsPerPage = 100;

  useEffect(() => {
    fetchBookings();
  }, [currentPage, sortField, sortOrder]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchBookings();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchBookings = async () => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setActionInProgress({ type: 'fetch', message: 'Loading bookings...' });
      }
      
      let query = supabase
        .from('appointments')
        .select('*', { count: 'exact' });
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,case_id.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }
      
      filters.forEach(filter => {
        if (filter.value) {
          if (filter.field === 'gender' || filter.field === 'status') {
            query = query.eq(filter.field, filter.value.toLowerCase());
          } else {
            query = query.ilike(filter.field, `%${filter.value}%`);
          }
        }
      });
      
      if (dateRange.start) {
        query = query.gte('appointment_date', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('appointment_date', dateRange.end);
      }
      
      const { count, error: countError } = await query;
      
      if (countError) throw countError;
      
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      
      const validPage = Math.max(1, Math.min(currentPage, Math.ceil((count || 0) / itemsPerPage)));
      if (validPage !== currentPage) {
        setCurrentPage(validPage);
      }
      
      query = query
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range((validPage - 1) * itemsPerPage, validPage * itemsPerPage - 1);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showNotification('Failed to fetch bookings', 'error');
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
      setActionInProgress(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
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
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchBookings();
  };

  const handleAddBooking = () => {
    setCurrentBooking(undefined);
    setShowBookingModal(true);
  };

  const handleQuickAddBooking = () => {
    setShowQuickBookingModal(true);
  };

  const handleCloseQuickBookingModal = () => {
    setShowQuickBookingModal(false);
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
    setActionInProgress({ type: 'delete', message: 'Deleting booking...' });
    try {
      setBookings(prevBookings => prevBookings.filter(b => b.id !== currentBooking.id));
      
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', currentBooking.id);

      if (error) {
        await fetchBookings();
        throw error;
      }
      
      setShowDeleteModal(false);
      showNotification('Booking deleted successfully', 'success');
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      showNotification('Failed to delete booking', 'error');
    } finally {
      setIsDeleting(false);
      setActionInProgress(null);
    }
  };

  const handleSaveBooking = async (booking: Partial<Booking>) => {
    try {
      if (currentBooking) {
        setActionInProgress({ type: 'update', message: 'Updating booking...' });
        
        setBookings(prevBookings => 
          prevBookings.map(b => b.id === currentBooking.id ? { ...b, ...booking } : b)
        );
        
        const { data, error } = await supabase
          .from('appointments')
          .update(booking)
          .eq('id', currentBooking.id)
          .select();

        if (error) {
          await fetchBookings();
          throw error;
        }
        
        showNotification('Booking updated successfully', 'success');
      } else {
        setActionInProgress({ type: 'create', message: 'Creating booking...' });
        
        const { data, error } = await supabase
          .from('appointments')
          .insert(booking)
          .select();

        if (error) throw error;
        
        if (data && data.length > 0) {
          setBookings(prevBookings => [data[0] as Booking, ...prevBookings]);
        }
        
        showNotification('Booking created successfully', 'success');
      }
      
      setShowBookingModal(false);
      setShowQuickBookingModal(false);
    } catch (error: any) {
      console.error('Error saving booking:', error);
      throw error;
    } finally {
      setActionInProgress(null);
    }
  };

  const handleStatusChange = async (booking: Booking, status: 'scheduled' | 'completed' | 'missed' | 'cancelled') => {
    try {
      setBookings(prevBookings => 
        prevBookings.map(b => b.id === booking.id ? { ...b, status } : b)
      );
      
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', booking.id)
        .select();

      if (error) {
        await fetchBookings();
        throw error;
      }
      
      showNotification(`Booking marked as ${status}`, 'success');
    } catch (error) {
      console.error('Error updating booking status:', error);
      showNotification('Failed to update booking status', 'error');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return {
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
    applyFilters
  };
}