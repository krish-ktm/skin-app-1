import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Doughnut } from 'react-chartjs-2';
import { supabase } from '../../../../lib/supabase';
import { PulseLoader } from 'react-spinners';

interface BookingInsightsProps {}

interface InsightData {
  completionRate: number;
  cancellationRate: number;
  repeatBookings: number;
  newBookings: number;
}

export function BookingInsights({}: BookingInsightsProps) {
  const [data, setData] = useState<InsightData>({
    completionRate: 0,
    cancellationRate: 0,
    repeatBookings: 0,
    newBookings: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInsightData();
  }, []);

  const fetchInsightData = async () => {
    setIsLoading(true);
    try {
      // Get total appointments
      const { count: totalCount, error: totalError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });
      
      if (totalError) throw totalError;
      
      // Get unique case IDs to determine repeat vs new bookings
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('case_id');
      
      if (appointmentsError) throw appointmentsError;
      
      // Count unique case IDs
      const caseIdCounts: Record<string, number> = {};
      appointments?.forEach(booking => {
        caseIdCounts[booking.case_id] = (caseIdCounts[booking.case_id] || 0) + 1;
      });
      
      // Count repeat bookings (case IDs with more than 1 booking)
      const repeatCaseIds = Object.entries(caseIdCounts).filter(([_, count]) => count > 1);
      const repeatCount = repeatCaseIds.length;
      
      // Count unique case IDs (new patients)
      const uniqueCount = Object.keys(caseIdCounts).length - repeatCount;
      
      // For completion rate, we'll use actual data if available
      // For this example, we'll calculate based on appointments in the past vs future
      const today = new Date().toISOString().split('T')[0];
      
      // Get past appointments (completed)
      const { count: pastCount, error: pastError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .lt('appointment_date', today);
      
      if (pastError) throw pastError;
      
      // Calculate completion rate (assuming 95% of past appointments were completed)
      // In a real app, you would have a status field to track this
      const completedCount = pastCount || 0;
      const completionRate = totalCount ? completedCount / totalCount : 0;
      const cancellationRate = 1 - completionRate;
      
      setData({
        completionRate,
        cancellationRate,
        repeatBookings: repeatCount,
        newBookings: uniqueCount
      });
    } catch (error) {
      console.error('Error fetching insight data:', error);
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

  const completionChartData = {
    labels: ['Completed', 'Upcoming'],
    datasets: [
      {
        data: [data.completionRate * 100, data.cancellationRate * 100],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(59, 130, 246, 0.8)'],
        borderColor: ['#16a34a', '#2563eb'],
        borderWidth: 1,
      },
    ],
  };

  const bookingTypeChartData = {
    labels: ['New Patients', 'Returning Patients'],
    datasets: [
      {
        data: [data.newBookings, data.repeatBookings],
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(168, 85, 247, 0.8)'],
        borderColor: ['#2563eb', '#7e22ce'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12,
          },
          usePointStyle: true,
        },
      },
    },
    cutout: '70%',
    responsive: true,
    maintainAspectRatio: false,
  };

  if (isLoading) {
    return (
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-md border border-gray-100"
        variants={cardVariants}
      >
        <h3 className="text-lg font-medium text-gray-800 mb-4">Booking Insights</h3>
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
      <h3 className="text-lg font-medium text-gray-800 mb-4">Booking Insights</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 text-center">Appointment Status</h4>
          <div className="h-48 relative">
            <Doughnut data={completionChartData} options={chartOptions} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="block text-2xl font-bold text-green-600">
                  {Math.round(data.completionRate * 100)}%
                </span>
                <span className="text-xs text-gray-500">Completed</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 text-center">Patient Booking Types</h4>
          <div className="h-48 relative">
            <Doughnut data={bookingTypeChartData} options={chartOptions} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="block text-2xl font-bold text-blue-600">
                  {data.repeatBookings > 0 ? Math.round((data.repeatBookings / (data.newBookings + data.repeatBookings)) * 100) : 0}%
                </span>
                <span className="text-xs text-gray-500">Returning</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">New Patients</p>
          <p className="text-xl font-bold text-blue-600">{data.newBookings}</p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Returning Patients</p>
          <p className="text-xl font-bold text-purple-600">{data.repeatBookings}</p>
        </div>
      </div>
    </motion.div>
  );
}