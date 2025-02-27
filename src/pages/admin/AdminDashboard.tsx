import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PulseLoader } from 'react-spinners';
import { Calendar, Clock, Users, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement, Filler } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { format, subDays, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

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

export default function AdminDashboard() {
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
      const today = new Date().toISOString().split('T')[0];
      
      // Total bookings
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

      // Total unique users
      const { count: totalUsers } = await supabase
        .from('appointments')
        .select('user_id', { count: 'exact', head: true })
        .not('user_id', 'is', null);

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
        totalUsers: totalUsers || 0,
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

  const formatTimeSlot = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <PulseLoader color="#3B82F6" />
      </div>
    );
  }

  // Enhanced Chart data and options
  const genderChartData = {
    labels: ['Male', 'Female'],
    datasets: [
      {
        data: [genderDistribution.male, genderDistribution.female],
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(236, 72, 153, 0.8)'],
        borderColor: ['#2563EB', '#DB2777'],
        borderWidth: 2,
        hoverBackgroundColor: ['rgba(59, 130, 246, 1)', 'rgba(236, 72, 153, 1)'],
        hoverBorderColor: ['#1D4ED8', '#BE185D'],
        hoverBorderWidth: 3,
      },
    ],
  };

  const genderChartOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
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
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = genderDistribution.male + genderDistribution.female;
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
    cutout: '65%',
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 2000,
    },
    maintainAspectRatio: false,
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
  };

  const timeSlotChartData = {
    labels: timeSlotDistribution.map(item => formatTimeSlot(item.time)),
    datasets: [
      {
        label: 'Bookings',
        data: timeSlotDistribution.map(item => item.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(217, 70, 239, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(244, 63, 94, 0.8)',
          'rgba(251, 113, 133, 0.8)',
          'rgba(249, 168, 212, 0.8)',
          'rgba(248, 113, 113, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(99, 102, 241, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(217, 70, 239, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(244, 63, 94, 1)',
          'rgba(251, 113, 133, 1)',
          'rgba(249, 168, 212, 1)',
          'rgba(248, 113, 113, 1)',
        ],
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(99, 102, 241, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(217, 70, 239, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(244, 63, 94, 1)',
          'rgba(251, 113, 133, 1)',
          'rgba(249, 168, 212, 1)',
          'rgba(248, 113, 113, 1)',
        ],
      },
    ],
  };

  const timeSlotChartOptions = {
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
        displayColors: true,
        usePointStyle: true,
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
        },
        grid: {
          display: false,
        },
      },
    },
    animation: {
      delay: (context: any) => context.dataIndex * 100,
      duration: 1000,
      easing: 'easeOutQuart',
    },
    maintainAspectRatio: false,
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
      
      {/* Stats Cards */}
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
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
          variants={cardVariants}
        >
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <span className="mr-2">Gender Distribution</span>
            {genderDistribution.male + genderDistribution.female > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {genderDistribution.male + genderDistribution.female} total
              </span>
            )}
          </h3>
          <div className="h-64 flex items-center justify-center">
            {genderDistribution.male + genderDistribution.female > 0 ? (
              <Doughnut 
                data={genderChartData} 
                options={genderChartOptions}
              />
            ) : (
              <div className="text-center text-gray-500">
                <p>No data available</p>
              </div>
            )}
          </div>
          {genderDistribution.male + genderDistribution.female > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-sm text-gray-600">Male</p>
                <p className="text-xl font-bold text-blue-600">{genderDistribution.male}</p>
                <p className="text-xs text-gray-500">
                  {((genderDistribution.male / (genderDistribution.male + genderDistribution.female)) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-pink-50 p-3 rounded-lg text-center">
                <p className="text-sm text-gray-600">Female</p>
                <p className="text-xl font-bold text-pink-600">{genderDistribution.female}</p>
                <p className="text-xs text-gray-500">
                  {((genderDistribution.female / (genderDistribution.male + genderDistribution.female)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Booking Trend */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
          variants={cardVariants}
        >
          <h3 className="text-lg font-medium text-gray-800 mb-4">Booking Trend (Last 7 Days)</h3>
          <div className="h-64">
            <Line 
              data={bookingTrendData} 
              options={bookingTrendOptions}
            />
          </div>
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

        {/* Popular Time Slots */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
          variants={cardVariants}
        >
          <h3 className="text-lg font-medium text-gray-800 mb-4">Popular Time Slots</h3>
          <div className="h-64">
            {timeSlotDistribution.length > 0 ? (
              <Bar 
                data={timeSlotChartData} 
                options={timeSlotChartOptions}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No time slot data available</p>
              </div>
            )}
          </div>
          {timeSlotDistribution.length > 0 && (
            <div className="mt-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 text-center">Most Popular Time</p>
                <p className="text-xl font-bold text-center text-indigo-600">
                  {formatTimeSlot(timeSlotDistribution.sort((a, b) => b.count - a.count)[0].time)}
                </p>
                <p className="text-xs text-gray-500 text-center">
                  with {timeSlotDistribution.sort((a, b) => b.count - a.count)[0].count} bookings
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Bookings */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
          variants={cardVariants}
        >
          <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Bookings</h3>
          {recentBookings.length > 0 ? (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {recentBookings.map((booking) => (
                  <li key={booking.id} className="py-3 hover:bg-gray-50 rounded-lg px-2 transition-colors duration-150">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{booking.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.appointment_date).toLocaleDateString()} at {formatTimeSlot(booking.appointment_time)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        booking.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {booking.gender}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Calendar className="h-12 w-12 mb-2 text-gray-400" />
              <p>No recent bookings</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* System Status */}
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
        variants={cardVariants}
      >
        <h3 className="text-lg font-medium text-gray-800 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100 hover:shadow-md transition-shadow duration-300">
            <div className="mr-4 bg-green-100 p-2 rounded-full">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">System Online</p>
              <p className="text-xs text-green-600">All services operational</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow duration-300">
            <div className="mr-4 bg-blue-100 p-2 rounded-full">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Performance</p>
              <p className="text-xs text-blue-600">Response time: 120ms</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-yellow-50 rounded-lg border border-yellow-100 hover:shadow-md transition-shadow duration-300">
            <div className="mr-4 bg-yellow-100 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-800">Notifications</p>
              <p className="text-xs text-yellow-600">0 pending alerts</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}