import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement, Filler } from 'chart.js';
import { format, subDays } from 'date-fns';

// Import dashboard components
import { StatsCards } from './components/dashboard/StatsCards';
import { AppointmentInsights } from './components/dashboard/AppointmentInsights';
import { PredictiveForecasting } from './components/dashboard/PredictiveForecasting';
import { BookingTrend } from './components/dashboard/BookingTrend';
import { GenderDistribution } from './components/dashboard/GenderDistribution';
import { DayOfWeekAnalytics } from './components/dashboard/DayOfWeekAnalytics';
import { TimeSlotDistribution } from './components/dashboard/TimeSlotDistribution';
import { RecentBookings } from './components/dashboard/RecentBookings';
import { SystemStatus } from './components/dashboard/SystemStatus';
import { DashboardLoader } from './components/dashboard/DashboardLoader';
import { AnalyticsProvider } from './components/dashboard/AnalyticsContext';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title,
  BarElement,
  Filler
);

function DashboardContent() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    upcomingBookings: 0,
    totalUsers: 0,
    totalTimeSlots: 0,
    disabledTimeSlots: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [genderDistribution, setGenderDistribution] = useState({ male: 0, female: 0 });
  const [bookingTrend, setBookingTrend] = useState<{date: string, count: number}[]>([]);
  const [timeSlotDistribution, setTimeSlotDistribution] = useState<{time: string, count: number}[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchGenderDistribution();
    fetchBookingTrend();
    fetchTimeSlotDistribution();
    fetchRecentBookings();
  }, []);

  async function fetchStats() {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Total bookings within the selected time range
      const { count: totalCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

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

  async function fetchGenderDistribution() {
    try {
      // Male count
      const { count: maleCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('gender', 'male');

      // Female count
      const { count: femaleCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('gender', 'female');

      setGenderDistribution({
        male: maleCount || 0,
        female: femaleCount || 0
      });
    } catch (error) {
      console.error('Error fetching gender distribution:', error);
    }
  }

  async function fetchBookingTrend() {
    try {
      // For booking trend, we'll show the last 7 days
      const today = new Date();
      const dates = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(today, 6 - i);
        return format(date, 'yyyy-MM-dd');
      });

      const bookingsByDate: {date: string, count: number}[] = [];

      for (const date of dates) {
        const { count } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('appointment_date', date);

        bookingsByDate.push({
          date,
          count: count || 0
        });
      }

      setBookingTrend(bookingsByDate);
    } catch (error) {
      console.error('Error fetching booking trend:', error);
    }
  }

  async function fetchTimeSlotDistribution() {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_time');

      if (error) throw error;

      const timeSlotCounts: Record<string, number> = {};
      
      data?.forEach(booking => {
        const time = booking.appointment_time;
        timeSlotCounts[time] = (timeSlotCounts[time] || 0) + 1;
      });

      const sortedTimeSlots = Object.entries(timeSlotCounts)
        .map(([time, count]) => ({ time, count }))
        .sort((a, b) => {
          const timeA = a.time.split(':').map(Number);
          const timeB = b.time.split(':').map(Number);
          return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        })
        .slice(0, 10);

      setTimeSlotDistribution(sortedTimeSlots);
    } catch (error) {
      console.error('Error fetching time slot distribution:', error);
    }
  }

  async function fetchRecentBookings() {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentBookings(data || []);
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  if (isLoading) {
    return <DashboardLoader />;
  }

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
      </div>
      
      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Booking Trend - Moved up as it's more important */}
      <BookingTrend bookingTrend={bookingTrend} />

      {/* Appointment Insights - High priority */}
      <AppointmentInsights />

      {/* Day of Week Analytics - Moved up for better scheduling insights */}
      <DayOfWeekAnalytics />

      {/* Time Slot Distribution - Important for scheduling */}
      <TimeSlotDistribution timeSlotDistribution={timeSlotDistribution} />

      {/* Gender Distribution */}
      <GenderDistribution genderDistribution={genderDistribution} />

      {/* Predictive Forecasting - Moved down as it's more advanced */}
      <PredictiveForecasting />

      {/* Recent Bookings */}
      <RecentBookings recentBookings={recentBookings} />

      {/* System Status */}
      <SystemStatus />
    </motion.div>
  );
}

export default function AdminDashboard() {
  return (
    <AnalyticsProvider>
      <DashboardContent />
    </AnalyticsProvider>
  );
}