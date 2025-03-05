import { useState, useEffect } from 'react';
import { supabase } from '../../../../../lib/supabase';
import type { SortField, SortOrder, Filter, DateRange } from '../../../types';

export function useBookings() {
  const [bookings, setBookings] = useState([]);
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
  const [actionInProgress, setActionInProgress] = useState<{
    type: 'fetch' | 'delete' | 'update' | 'create';
    message: string;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchBookings();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchBookings = async () => {
    try {
      setActionInProgress({ type: 'fetch', message: 'Loading bookings...' });
      
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
      
      const { count } = await query;
      
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / 100));
      
      const validPage = Math.max(1, Math.min(currentPage, Math.ceil((count || 0) / 100)));
      if (validPage !== currentPage) {
        setCurrentPage(validPage);
      }
      
      query = query
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range((validPage - 1) * 100, validPage * 100 - 1);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
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

  const clearFilters = () => {
    setFilters([]);
    setDateRange({ start: '', end: '' });
    setSearchTerm('');
    setCurrentPage(1);
    fetchBookings();
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchBookings();
  };

  return {
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
    handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value),
    handleFilterChange,
    handleDateRangeChange,
    clearFilters,
    applyFilters,
    fetchBookings,
    setCurrentPage,
    setShowFilters,
  };
}