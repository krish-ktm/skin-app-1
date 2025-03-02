import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users } from 'lucide-react';
import { TimeRangeSelector, TimeRange, getTimeRangeDate } from './TimeRangeSelector';
import { supabase } from '../../../../lib/supabase';
import { useAnalytics } from './AnalyticsContext';
import { PulseLoader } from 'react-spinners';

interface StatsCardsProps {
  stats: {
    totalBookings: number;
    todayBookings: number;
    upcomingBookings: number;
    totalTimeSlots: number;
    disabledTimeSlots: number;
    totalUsers: number;
  };
}

export function StatsCards({ stats: initialStats }: StatsCardsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [stats, setStats] = useState(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const { refreshTrigger } = useAnalytics();
  
  const startDate = getTimeRangeDate(timeRange);
  
  useEffect(() => {
    fetchStats();
  }, [timeRange, refreshTrigger]);
  
  async function fetchStats() {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Total bookings within the selected time range
      const { count: totalCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Today's bookings
      const { count: todayCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', today);

      // Upcoming bookings
      const { count: upcomingCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('appointment_date', today);

      // Total unique users within the selected time range
      const { data: uniqueUsers, error: usersError } = await supabase
        .from('appointments')
        .select('user_id')
        .gte('created_at', startDate.toISOString())
        .not('user_id', 'is', null);

      if (usersError) throw usersError;
      
      // Count unique user IDs
      const uniqueUserIds = new Set();
      uniqueUsers?.forEach(appointment => {
        if (appointment.user_id) {
          uniqueUserIds.add(appointment.user_id);
        }
      });

      // Time slot stats
      const { data: timeSlotData, error: timeSlotError } = await supabase
        .from('time_slot_settings')
        .select('*');

      if (timeSlotError) throw timeSlotError;

      const totalTimeSlots = timeSlotData?.length || 0;
      const disabledTimeSlots = timeSlotData?.filter(slot => slot.is_disabled).length || 0;

      setStats({
        totalBookings: totalCount || 0,
        todayBookings: todayCount || 0,
        upcomingBookings: upcomingCount || 0,
        totalUsers: uniqueUserIds.size,
        totalTimeSlots,
        disabledTimeSlots
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
      }
    }
  };

  // Get time range label for display
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      case '6m': return 'Last 6 months';
      case '1y': return 'Last year';
      case 'all': return 'All time';
      default: return 'Selected period';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-medium text-gray-700">Overview Statistics</h3>
        <TimeRangeSelector 
          selectedRange={timeRange}
          onChange={setTimeRange}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300 relative"
          variants={cardVariants}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg">
              <PulseLoader size={8} color="#3B82F6" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-600">Total Bookings</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalBookings}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <span className="text-green-500 font-medium">{stats.todayBookings} today</span> · {stats.upcomingBookings} upcoming
          </div>
          <div className="mt-1 text-xs text-gray-400">
            {getTimeRangeLabel()}
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
          variants={cardVariants}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-600">Time Slots</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalTimeSlots}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <span className="text-red-500 font-medium">{stats.disabledTimeSlots} disabled</span> · {stats.totalTimeSlots - stats.disabledTimeSlots} available
          </div>
          <div className="mt-1 text-xs text-gray-400">
            Current configuration
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300 relative"
          variants={cardVariants}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg">
              <PulseLoader size={8} color="#3B82F6" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-600">Unique Users</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalUsers}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <span className="text-blue-500 font-medium">
              {((stats.totalUsers / Math.max(stats.totalBookings, 1)) * 100).toFixed(1)}% booking rate
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-400">
            {getTimeRangeLabel()}
          </div>
        </motion.div>
      </div>
    </div>
  );
}