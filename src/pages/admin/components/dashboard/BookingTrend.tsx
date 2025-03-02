import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { format, parseISO, subDays } from 'date-fns';
import { TimeRangeSelector, TimeRange, getTimeRangeDate } from './TimeRangeSelector';
import { supabase } from '../../../../lib/supabase';
import { useAnalytics } from './AnalyticsContext';
import { PulseLoader } from 'react-spinners';

interface BookingTrendProps {
  bookingTrend: {
    date: string;
    count: number;
  }[];
}

export function BookingTrend({ bookingTrend: initialTrend }: BookingTrendProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [bookingTrend, setBookingTrend] = useState(initialTrend);
  const [isLoading, setIsLoading] = useState(false);
  const { refreshTrigger } = useAnalytics();
  
  const startDate = getTimeRangeDate(timeRange);
  
  useEffect(() => {
    fetchBookingTrend();
  }, [timeRange, refreshTrigger]);
  
  async function fetchBookingTrend() {
    setIsLoading(true);
    try {
      // Get the number of days to fetch based on time range
      let daysToFetch = 7;
      switch(timeRange) {
        case '30d': daysToFetch = 30; break;
        case '90d': daysToFetch = 90; break;
        case '6m': daysToFetch = 180; break;
        case '1y': daysToFetch = 365; break;
        case 'all': daysToFetch = 365; break; // Limit to 1 year for "all" to keep chart readable
        default: daysToFetch = 7;
      }
      
      // For booking trend, we'll show the last X days based on time range
      const today = new Date();
      const dates = Array.from({ length: daysToFetch }, (_, i) => {
        const date = subDays(today, daysToFetch - 1 - i);
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

  const bookingTrendData = {
    labels: bookingTrend.map(item => format(parseISO(item.date), 'MMM dd')),
    datasets: [
      {
        label: 'Bookings',
        data: bookingTrend.map(item => item.count),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
        borderWidth: 3,
      },
    ],
  };

  const bookingTrendOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleFont: {
          size: 14,
          family: "'Inter', sans-serif",
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
          family: "'Inter', sans-serif",
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        enabled: true,
        intersect: false,
        mode: 'index',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          font: {
            family: "'Inter', sans-serif",
          },
          color: 'rgba(107, 114, 128, 1)',
        },
        grid: {
          color: 'rgba(243, 244, 246, 1)',
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          font: {
            family: "'Inter', sans-serif",
          },
          color: 'rgba(107, 114, 128, 1)',
          maxRotation: 45,
          minRotation: 45,
          callback: function(value: any, index: number) {
            // Show fewer labels for readability when we have many days
            if (bookingTrend.length > 30) {
              return index % 7 === 0 ? this.getLabelForValue(value) : '';
            } else if (bookingTrend.length > 14) {
              return index % 3 === 0 ? this.getLabelForValue(value) : '';
            }
            return this.getLabelForValue(value);
          }
        },
        grid: {
          display: false,
        },
      },
    },
    animation: {
      duration: 2000,
    },
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
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
    <motion.div 
      className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
      variants={cardVariants}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h3 className="text-lg font-medium text-gray-800">Booking Trend</h3>
        <TimeRangeSelector 
          selectedRange={timeRange}
          onChange={setTimeRange}
        />
      </div>
      
      <p className="text-sm text-gray-500 mb-4">{getTimeRangeLabel()}</p>
      
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <PulseLoader color="#3B82F6" />
        </div>
      ) : (
        <div className="h-64">
          <Line 
            data={bookingTrendData} 
            options={bookingTrendOptions}
          />
        </div>
      )}
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Total in Period</p>
          <p className="text-xl font-bold text-blue-600">
            {bookingTrend.reduce((sum, item) => sum + item.count, 0)}
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Daily Average</p>
          <p className="text-xl font-bold text-green-600">
            {(bookingTrend.reduce((sum, item) => sum + item.count, 0) / bookingTrend.length).toFixed(1)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}