import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { supabase } from '../../../../lib/supabase';
import { PulseLoader } from 'react-spinners';
import { Calendar, Clock } from 'lucide-react';

interface DayOfWeekAnalyticsProps {}

interface DayData {
  day: string;
  count: number;
  percentage: number;
}

export function DayOfWeekAnalytics({}: DayOfWeekAnalyticsProps) {
  const [data, setData] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busiest, setBusiest] = useState<{day: string, count: number}>({day: '', count: 0});
  const [quietest, setQuietest] = useState<{day: string, count: number}>({day: '', count: 0});
  const [totalAppointments, setTotalAppointments] = useState(0);

  useEffect(() => {
    fetchDayOfWeekData();
  }, []);

  const fetchDayOfWeekData = async () => {
    setIsLoading(true);
    try {
      // Get all appointments
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_date');
      
      if (error) throw error;
      
      // Initialize counts for each day of the week
      const dayCounts: Record<string, number> = {
        'Sunday': 0,
        'Monday': 0,
        'Tuesday': 0,
        'Wednesday': 0,
        'Thursday': 0,
        'Friday': 0,
        'Saturday': 0
      };
      
      // Count appointments by day of week
      appointments?.forEach(appointment => {
        const date = new Date(appointment.appointment_date);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
        dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1;
      });
      
      const total = appointments?.length || 0;
      setTotalAppointments(total);
      
      // Convert to array and calculate percentages
      const dayData: DayData[] = Object.entries(dayCounts).map(([day, count]) => ({
        day,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }));
      
      // Find busiest and quietest days
      if (total > 0) {
        const sortedDays = [...dayData].sort((a, b) => b.count - a.count);
        setBusiest({
          day: sortedDays[0].day,
          count: sortedDays[0].count
        });
        setQuietest({
          day: sortedDays[sortedDays.length - 1].count > 0 ? sortedDays[sortedDays.length - 1].day : 'None',
          count: sortedDays[sortedDays.length - 1].count
        });
      }
      
      setData(dayData);
    } catch (error) {
      console.error('Error fetching day of week data:', error);
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
    labels: data.map(item => item.day),
    datasets: [
      {
        label: 'Appointments',
        data: data.map(item => item.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)', // Monday - Blue
          'rgba(16, 185, 129, 0.7)', // Tuesday - Green
          'rgba(139, 92, 246, 0.7)', // Wednesday - Purple
          'rgba(245, 158, 11, 0.7)', // Thursday - Amber
          'rgba(236, 72, 153, 0.7)', // Friday - Pink
          'rgba(99, 102, 241, 0.7)', // Saturday - Indigo
          'rgba(239, 68, 68, 0.7)'   // Sunday - Red
        ],
        borderColor: [
          'rgb(37, 99, 235)',
          'rgb(5, 150, 105)',
          'rgb(124, 58, 237)',
          'rgb(217, 119, 6)',
          'rgb(219, 39, 119)',
          'rgb(79, 70, 229)',
          'rgb(220, 38, 38)'
        ],
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const percentage = data[context.dataIndex].percentage.toFixed(1);
            return `${value} appointments (${percentage}%)`;
          }
        },
        enabled: true,
        intersect: false,
        mode: 'index',
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  if (isLoading) {
    return (
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-md border border-gray-100"
        variants={cardVariants}
      >
        <h3 className="text-lg font-medium text-gray-800 mb-4">Appointment Distribution by Day</h3>
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
      <h3 className="text-lg font-medium text-gray-800 mb-1">Appointment Distribution by Day</h3>
      <p className="text-sm text-gray-500 mb-4">All-time booking patterns</p>
      
      <div className="h-64 mb-6">
        <Bar data={chartData} options={chartOptions} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-blue-50 p-3 rounded-lg flex items-center">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Busiest Day</p>
            <p className="text-lg font-bold text-blue-600">
              {busiest.day}
              {busiest.count > 0 && <span className="text-xs font-normal ml-1">({busiest.count})</span>}
            </p>
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg flex items-center">
          <div className="bg-green-100 p-2 rounded-full mr-3">
            <Clock className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Quietest Day</p>
            <p className="text-lg font-bold text-green-600">
              {quietest.day}
              {quietest.count > 0 && <span className="text-xs font-normal ml-1">({quietest.count})</span>}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}