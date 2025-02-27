import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
import { supabase } from '../../../../lib/supabase';
import { PulseLoader } from 'react-spinners';

interface PerformanceData {
  dates: string[];
  bookings: number[];
  conversions: number[];
}

export function PerformanceMetrics() {
  const [data, setData] = useState<PerformanceData>({
    dates: [],
    bookings: [],
    conversions: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const dates = Array.from({ length: 14 }, (_, i) => {
        const date = subDays(today, 13 - i);
        return format(date, 'yyyy-MM-dd');
      });

      const bookingsByDate: number[] = [];
      const conversionsByDate: number[] = [];

      // Fetch booking data for each date
      for (const date of dates) {
        const { count: bookingCount, error: bookingError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('appointment_date', date);

        if (bookingError) throw bookingError;
        
        bookingsByDate.push(bookingCount || 0);
        
        // For demo purposes, simulate conversion rates (70-90%)
        const conversionRate = 0.7 + (Math.random() * 0.2);
        const conversions = Math.round((bookingCount || 0) * conversionRate);
        conversionsByDate.push(conversions);
      }

      setData({
        dates: dates.map(date => format(new Date(date), 'MMM dd')),
        bookings: bookingsByDate,
        conversions: conversionsByDate
      });
    } catch (error) {
      console.error('Error fetching performance data:', error);
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

  const chartData = {
    labels: data.dates,
    datasets: [
      {
        label: 'Bookings',
        data: data.bookings,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Conversions',
        data: data.conversions,
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
          },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: 'rgba(107, 114, 128, 1)',
        },
        grid: {
          color: 'rgba(243, 244, 246, 1)',
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          color: 'rgba(107, 114, 128, 1)',
        },
        grid: {
          display: false,
        },
      },
    },
    maintainAspectRatio: false,
  };

  if (isLoading) {
    return (
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-md border border-gray-100"
        variants={cardVariants}
      >
        <h3 className="text-lg font-medium text-gray-800 mb-4">Performance Metrics</h3>
        <div className="flex justify-center py-8">
          <PulseLoader color="#3B82F6" />
        </div>
      </motion.div>
    );
  }

  // Calculate averages and totals
  const totalBookings = data.bookings.reduce((sum, val) => sum + val, 0);
  const totalConversions = data.conversions.reduce((sum, val) => sum + val, 0);
  const avgBookingsPerDay = totalBookings / data.bookings.length || 0;
  const conversionRate = totalBookings > 0 ? (totalConversions / totalBookings) * 100 : 0;

  return (
    <motion.div 
      className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
      variants={cardVariants}
    >
      <h3 className="text-lg font-medium text-gray-800 mb-4">Performance Metrics (Last 14 Days)</h3>
      
      <div className="h-64 mb-6">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Total Bookings</p>
          <p className="text-xl font-bold text-blue-600">{totalBookings}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Conversions</p>
          <p className="text-xl font-bold text-green-600">{totalConversions}</p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Avg. Daily</p>
          <p className="text-xl font-bold text-purple-600">{avgBookingsPerDay.toFixed(1)}</p>
        </div>
        <div className="bg-amber-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Conversion Rate</p>
          <p className="text-xl font-bold text-amber-600">{conversionRate.toFixed(1)}%</p>
        </div>
      </div>
    </motion.div>
  );
}