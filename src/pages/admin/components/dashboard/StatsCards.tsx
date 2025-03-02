import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users } from 'lucide-react';
import { useAnalytics } from './AnalyticsContext';

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

export function StatsCards({ stats }: StatsCardsProps) {
  const { timeRange } = useAnalytics();
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
        variants={cardVariants}
      >
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
        className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
        variants={cardVariants}
      >
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
  );
}