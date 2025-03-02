import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../../lib/supabase';
import { PulseLoader } from 'react-spinners';
import { format, parseISO, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { Calendar, Clock, TrendingUp, AlertTriangle, Users, Zap } from 'lucide-react';
import { useAnalytics } from './AnalyticsContext';

interface AppointmentInsightsProps {}

interface InsightData {
  averageBookingLeadTime: {
    days: number;
    hours: number;
    minutes: number;
  };
  statusDistribution: {
    scheduled: number;
    completed: number;
    missed: number;
    cancelled: number;
  };
  ageGroupDistribution: {
    labels: string[];
    data: number[];
  };
  peakBookingTimes: {
    hour: string;
    count: number;
  }[];
  patientRetention: number;
  mostCommonAge: number;
}

export function AppointmentInsights({}: AppointmentInsightsProps) {
  const { startDate, endDate, refreshTrigger } = useAnalytics();
  const [data, setData] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leadTime' | 'status' | 'age' | 'peak'>('leadTime');

  useEffect(() => {
    fetchInsightData();
  }, [startDate, endDate, refreshTrigger]);

  const fetchInsightData = async () => {
    setIsLoading(true);
    try {
      // Get all appointments with relevant data within the selected time range
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('created_at, appointment_date, appointment_time, status, age')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (error) throw error;
      
      if (!appointments || appointments.length === 0) {
        throw new Error('No appointment data available');
      }

      // Calculate average booking lead time
      let totalLeadTimeMinutes = 0;
      appointments.forEach(appointment => {
        const createdAt = new Date(appointment.created_at);
        const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
        
        const leadTimeMinutes = Math.max(0, (appointmentDateTime.getTime() - createdAt.getTime()) / (1000 * 60));
        totalLeadTimeMinutes += leadTimeMinutes;
      });
      
      const avgLeadTimeMinutes = totalLeadTimeMinutes / appointments.length;
      const days = Math.floor(avgLeadTimeMinutes / (24 * 60));
      const hours = Math.floor((avgLeadTimeMinutes % (24 * 60)) / 60);
      const minutes = Math.floor(avgLeadTimeMinutes % 60);
      
      // Calculate status distribution
      const statusCounts = {
        scheduled: 0,
        completed: 0,
        missed: 0,
        cancelled: 0
      };
      
      appointments.forEach(appointment => {
        if (appointment.status && statusCounts.hasOwnProperty(appointment.status)) {
          statusCounts[appointment.status as keyof typeof statusCounts]++;
        } else {
          // Default to scheduled if status is not set
          statusCounts.scheduled++;
        }
      });
      
      // Calculate age group distribution
      const ageGroups = {
        '0-18': 0,
        '19-30': 0,
        '31-45': 0,
        '46-60': 0,
        '61+': 0
      };
      
      let ageSum = 0;
      let ageCount = 0;
      const ageFrequency: Record<number, number> = {};
      
      appointments.forEach(appointment => {
        const age = appointment.age || 0;
        
        // Track for most common age
        ageFrequency[age] = (ageFrequency[age] || 0) + 1;
        
        // Only count valid ages for average
        if (age > 0) {
          ageSum += age;
          ageCount++;
        }
        
        // Categorize into age groups
        if (age <= 18) ageGroups['0-18']++;
        else if (age <= 30) ageGroups['19-30']++;
        else if (age <= 45) ageGroups['31-45']++;
        else if (age <= 60) ageGroups['46-60']++;
        else ageGroups['61+']++;
      });
      
      // Find most common age
      let mostCommonAge = 0;
      let highestFrequency = 0;
      
      Object.entries(ageFrequency).forEach(([age, frequency]) => {
        if (frequency > highestFrequency && parseInt(age) > 0) {
          mostCommonAge = parseInt(age);
          highestFrequency = frequency;
        }
      });
      
      // Calculate peak booking times (when appointments are created)
      const bookingHours: Record<string, number> = {};
      
      appointments.forEach(appointment => {
        const createdAt = new Date(appointment.created_at);
        const hour = createdAt.getHours();
        const hourStr = `${hour.toString().padStart(2, '0')}:00`;
        
        bookingHours[hourStr] = (bookingHours[hourStr] || 0) + 1;
      });
      
      const peakBookingTimes = Object.entries(bookingHours)
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Calculate patient retention (returning patients)
      const uniqueCaseIds = new Set();
      const returningCaseIds = new Set();
      
      appointments.forEach(appointment => {
        const caseId = appointment.case_id;
        if (uniqueCaseIds.has(caseId)) {
          returningCaseIds.add(caseId);
        } else {
          uniqueCaseIds.add(caseId);
        }
      });
      
      const patientRetention = uniqueCaseIds.size > 0 
        ? (returningCaseIds.size / uniqueCaseIds.size) * 100 
        : 0;
      
      setData({
        averageBookingLeadTime: {
          days,
          hours,
          minutes
        },
        statusDistribution: statusCounts,
        ageGroupDistribution: {
          labels: Object.keys(ageGroups),
          data: Object.values(ageGroups)
        },
        peakBookingTimes,
        patientRetention,
        mostCommonAge
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

  if (isLoading) {
    return (
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-md border border-gray-100"
        variants={cardVariants}
      >
        <h3 className="text-lg font-medium text-gray-800 mb-4">Appointment Insights</h3>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-medium text-gray-800">Appointment Insights</h3>
        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('leadTime')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
              activeTab === 'leadTime' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Lead Time</span>
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
              activeTab === 'status' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Status</span>
          </button>
          <button
            onClick={() => setActiveTab('age')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
              activeTab === 'age' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Age</span>
          </button>
          <button
            onClick={() => setActiveTab('peak')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
              activeTab === 'peak' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Peak Times</span>
          </button>
        </div>
      </div>
      
      {data && (
        <>
          {activeTab === 'leadTime' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h4 className="text-lg font-medium text-blue-800 mb-2">Average Booking Lead Time</h4>
                <p className="text-sm text-blue-600 mb-4">
                  On average, patients book their appointments this far in advance:
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-3xl font-bold text-blue-600">{data.averageBookingLeadTime.days}</p>
                    <p className="text-sm text-gray-600">Days</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-3xl font-bold text-blue-600">{data.averageBookingLeadTime.hours}</p>
                    <p className="text-sm text-gray-600">Hours</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-3xl font-bold text-blue-600">{data.averageBookingLeadTime.minutes}</p>
                    <p className="text-sm text-gray-600">Minutes</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>
                      {data.averageBookingLeadTime.days < 1 
                        ? "Patients are booking with very short notice. Consider extending your advance booking window."
                        : data.averageBookingLeadTime.days > 7
                          ? "Patients are booking well in advance. Your scheduling system is working effectively."
                          : "Patients are booking with reasonable notice. Your scheduling system is working as expected."}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Same-day Bookings</p>
                  <p className="text-xl font-bold text-green-600">
                    {data.averageBookingLeadTime.days < 1 ? "High" : "Low"}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Advance Planning</p>
                  <p className="text-xl font-bold text-purple-600">
                    {data.averageBookingLeadTime.days > 3 ? "Good" : "Limited"}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Patient Retention</p>
                  <p className="text-xl font-bold text-blue-600">{data.patientRetention.toFixed(1)}%</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Most Common Age</p>
                  <p className="text-xl font-bold text-amber-600">{data.mostCommonAge}</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                <h4 className="text-lg font-medium text-purple-800 mb-2">Appointment Status Distribution</h4>
                <p className="text-sm text-purple-600 mb-4">
                  Current status breakdown of all appointments:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100">
                    <p className="text-3xl font-bold text-blue-600">{data.statusDistribution.scheduled}</p>
                    <p className="text-sm text-gray-600">Scheduled</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-100">
                    <p className="text-3xl font-bold text-green-600">{data.statusDistribution.completed}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-100">
                    <p className="text-3xl font-bold text-red-600">{data.statusDistribution.missed}</p>
                    <p className="text-sm text-gray-600">Missed</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-3xl font-bold text-gray-600">{data.statusDistribution.cancelled}</p>
                    <p className="text-sm text-gray-600">Cancelled</p>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>
                      {data.statusDistribution.missed > (data.statusDistribution.completed * 0.2)
                        ? "High rate of missed appointments. Consider implementing reminder system."
                        : "Healthy appointment completion rate. Your reminder system is working effectively."}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-xl font-bold text-green-600">
                    {data.statusDistribution.completed > 0 
                      ? `${Math.round((data.statusDistribution.completed / 
                          (data.statusDistribution.completed + 
                           data.statusDistribution.missed + 
                           data.statusDistribution.cancelled)) * 100)}%`
                      : '0%'}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">No-show Rate</p>
                  <p className="text-xl font-bold text-red-600">
                    {data.statusDistribution.missed > 0 
                      ? `${Math.round((data.statusDistribution.missed / 
                          (data.statusDistribution.completed + 
                           data.statusDistribution.missed + 
                           data.statusDistribution.cancelled)) * 100)}%`
                      : '0%'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Cancellation Rate</p>
                  <p className="text-xl font-bold text-gray-600">
                    {data.statusDistribution.cancelled > 0 
                      ? `${Math.round((data.statusDistribution.cancelled / 
                          (data.statusDistribution.completed + 
                           data.statusDistribution.missed + 
                           data.statusDistribution.cancelled)) * 100)}%`
                      : '0%'}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-xl font-bold text-blue-600">{data.statusDistribution.scheduled}</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'age' && (
            <div className="space-y-6">
              <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                <h4 className="text-lg font-medium text-green-800 mb-2">Patient Age Distribution</h4>
                <p className="text-sm text-green-600 mb-4">
                  Age breakdown of all patients:
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {data.ageGroupDistribution.labels.map((label, index) => {
                    const value = data.ageGroupDistribution.data[index];
                    const total = data.ageGroupDistribution.data.reduce((sum, val) => sum + val, 0);
                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                    
                    return (
                      <div key={label} className="text-center">
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100">
                          <p className="text-lg font-bold text-green-600">{value}</p>
                          <p className="text-xs text-gray-600">{label}</p>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{percentage}%</p>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>
                      {data.ageGroupDistribution.data[2] > 
                       Math.max(...data.ageGroupDistribution.data.filter((_, i) => i !== 2))
                        ? "Middle-aged adults (31-45) form your largest patient group."
                        : data.ageGroupDistribution.data[0] > 
                          Math.max(...data.ageGroupDistribution.data.filter((_, i) => i !== 0))
                          ? "Youth patients (0-18) form your largest patient group."
                          : data.ageGroupDistribution.data[4] > 
                            Math.max(...data.ageGroupDistribution.data.filter((_, i) => i !== 4))
                            ? "Senior patients (61+) form your largest patient group."
                            : "You have a balanced age distribution among patients."}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Most Common Age</p>
                  <p className="text-xl font-bold text-blue-600">{data.mostCommonAge}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Largest Age Group</p>
                  <p className="text-xl font-bold text-purple-600">
                    {data.ageGroupDistribution.labels[
                      data.ageGroupDistribution.data.indexOf(
                        Math.max(...data.ageGroupDistribution.data)
                      )
                    ]}
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Youth Percentage</p>
                  <p className="text-xl font-bold text-amber-600">
                    {data.ageGroupDistribution.data[0] > 0 
                      ? `${Math.round((data.ageGroupDistribution.data[0] / 
                          data.ageGroupDistribution.data.reduce((sum, val) => sum + val, 0)) * 100)}%`
                      : '0%'}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Senior Percentage</p>
                  <p className="text-xl font-bold text-green-600">
                    {data.ageGroupDistribution.data[4] > 0 
                      ? `${Math.round((data.ageGroupDistribution.data[4] / 
                          data.ageGroupDistribution.data.reduce((sum, val) => sum + val, 0)) * 100)}%`
                      : '0%'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'peak' && (
            <div className="space-y-6">
              <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
                <h4 className="text-lg font-medium text-amber-800 mb-2">Peak Booking Times</h4>
                <p className="text-sm text-amber-600 mb-4">
                  Times when patients are most likely to make bookings:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {data.peakBookingTimes.map((peak, index) => {
                    const [hour] = peak.hour.split(':');
                    const hourNum = parseInt(hour);
                    const ampm = hourNum >= 12 ? 'PM' : 'AM';
                    const hour12 = hourNum % 12 || 12;
                    const formattedHour = `${hour12} ${ampm}`;
                    
                    return (
                      <div key={peak.hour} className="bg-white p-4 rounded-lg shadow-sm border border-amber-100 text-center">
                        <div className="text-2xl font-bold text-amber-600">{peak.count}</div>
                        <div className="text-sm text-gray-600">{formattedHour}</div>
                        <div className="text-xs text-amber-500 mt-1">Rank #{index + 1}</div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>
                      {data.peakBookingTimes.length > 0 && parseInt(data.peakBookingTimes[0].hour) >= 18
                        ? "Most bookings are made in the evening. Consider extending customer service hours."
                        : data.peakBookingTimes.length > 0 && parseInt(data.peakBookingTimes[0].hour) <= 10
                          ? "Most bookings are made in the morning. Ensure adequate staff during morning hours."
                          : "Bookings are distributed throughout the day. Your staffing seems well-balanced."}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Peak Hour</p>
                  <p className="text-xl font-bold text-blue-600">
                    {data.peakBookingTimes.length > 0 
                      ? (() => {
                          const [hour] = data.peakBookingTimes[0].hour.split(':');
                          const hourNum = parseInt(hour);
                          const ampm = hourNum >= 12 ? 'PM' : 'AM';
                          const hour12 = hourNum % 12 || 12;
                          return `${hour12} ${ampm}`;
                        })()
                      : 'N/A'}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Morning Bookings</p>
                  <p className="text-xl font-bold text-purple-600">
                    {data.peakBookingTimes
                      .filter(peak => parseInt(peak.hour) < 12)
                      .reduce((sum, peak) => sum + peak.count, 0)}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Afternoon Bookings</p>
                  <p className="text-xl font-bold text-green-600">
                    {data.peakBookingTimes
                      .filter(peak => parseInt(peak.hour) >= 12 && parseInt(peak.hour) < 18)
                      .reduce((sum, peak) => sum + peak.count, 0)}
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Evening Bookings</p>
                  <p className="text-xl font-bold text-amber-600">
                    {data.peakBookingTimes
                      .filter(peak => parseInt(peak.hour) >= 18)
                      .reduce((sum, peak) => sum + peak.count, 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}