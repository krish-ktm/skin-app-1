import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Users, Calendar } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { PulseLoader } from 'react-spinners';

interface RealTimeData {
  activeUsers: number;
  lastBooking: {
    time: string;
    name: string;
  } | null;
  bookingsToday: number;
  bookingRate: number;
}

export function RealTimeAnalytics() {
  const [data, setData] = useState<RealTimeData>({
    activeUsers: 0,
    lastBooking: null,
    bookingsToday: 0,
    bookingRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRealTimeData();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('real-time-analytics')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'appointments' 
      }, () => {
        fetchRealTimeData();
      })
      .subscribe();

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchRealTimeData();
    }, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const fetchRealTimeData = async () => {
    setIsLoading(true);
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Get bookings made today
      const { data: todayBookings, error: todayError } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', today);
      
      if (todayError) throw todayError;
      
      // Get most recent booking
      const { data: recentBooking, error: recentError } = await supabase
        .from('appointments')
        .select('name, created_at, appointment_time')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (recentError && recentError.code !== 'PGRST116') throw recentError;
      
      // Get total bookings in the last hour
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const { data: recentHourBookings, error: hourError } = await supabase
        .from('appointments')
        .select('created_at')
        .gte('created_at', oneHourAgo.toISOString());
      
      if (hourError) throw hourError;
      
      // Calculate booking rate (bookings per hour)
      const bookingRate = recentHourBookings?.length || 0;
      
      // Count active users (this would be 0 since we don't have real tracking)
      const activeUsers = 0;
      
      setData({
        activeUsers,
        lastBooking: recentBooking ? {
          time: new Date(recentBooking.created_at).toLocaleTimeString(),
          name: recentBooking.name
        } : null,
        bookingsToday: todayBookings?.length || 0,
        bookingRate
      });
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-md border border-gray-100"
        variants={cardVariants}
      >
        <h3 className="text-lg font-medium text-gray-800 mb-4">Real-Time Analytics</h3>
        <div className="flex justify-center py-8">
          <PulseLoader color="#3B82F6" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
      variants={cardVariants}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-800">Real-Time Analytics</h3>
        <span className="flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
          Live
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-50 p-3 rounded-lg flex items-center">
          <div className="bg-purple-100 p-2 rounded-full mr-3">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Booking Rate</p>
            <p className="text-xl font-bold text-purple-600">{data.bookingRate}/hr</p>
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg flex items-center">
          <div className="bg-green-100 p-2 rounded-full mr-3">
            <Calendar className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Today's Bookings</p>
            <p className="text-xl font-bold text-green-600">{data.bookingsToday}</p>
          </div>
        </div>
        
        <div className="bg-amber-50 p-3 rounded-lg flex items-center col-span-2">
          <div className="bg-amber-100 p-2 rounded-full mr-3">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Booking</p>
            <p className="text-sm font-medium text-amber-600">
              {data.lastBooking ? (
                <>
                  <span className="block truncate w-24">{data.lastBooking.name}</span>
                  <span className="text-xs text-amber-500">{data.lastBooking.time}</span>
                </>
              ) : (
                'No bookings yet'
              )}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}