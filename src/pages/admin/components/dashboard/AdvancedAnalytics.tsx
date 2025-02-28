import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import { supabase } from '../../../../lib/supabase';
import { PulseLoader } from 'react-spinners';
import { format, subMonths, eachDayOfInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { TrendingUp, Calendar, BarChart4, Activity, Clock, Users, MapPin } from 'lucide-react';

interface AnalyticsData {
  monthlyTrends: {
    labels: string[];
    male: number[];
    female: number[];
    total: number[];
  };
  peakHours: {
    hour: string;
    count: number;
  }[];
  weekdayDistribution: {
    day: string;
    count: number;
  }[];
  growthRate: number;
  conversionRate: number;
  retentionRate: number;
  appointmentDuration: {
    labels: string[];
    data: number[];
  };
  patientAgeDistribution: {
    labels: string[];
    data: number[];
  };
}

export function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'monthly' | 'hourly' | 'weekday' | 'duration' | 'demographics'>('monthly');
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y'>('6m');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Get the date range based on selected time range
      const endDate = new Date();
      let startDate;
      
      switch (timeRange) {
        case '3m':
          startDate = subMonths(endDate, 3);
          break;
        case '1y':
          startDate = subMonths(endDate, 12);
          break;
        case '6m':
        default:
          startDate = subMonths(endDate, 6);
          break;
      }
      
      // Get all appointments
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_date, appointment_time, gender, created_at, case_id')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      // Process monthly trends
      const monthCount = timeRange === '3m' ? 3 : timeRange === '1y' ? 12 : 6;
      const months = Array.from({ length: monthCount }, (_, i) => {
        const date = subMonths(endDate, monthCount - 1 - i);
        return {
          label: format(date, 'MMM yyyy'),
          start: startOfMonth(date).toISOString(),
          end: endOfMonth(date).toISOString()
        };
      });
      
      const monthlyTrends = {
        labels: months.map(m => m.label),
        male: months.map(month => 
          appointments?.filter(a => 
            a.created_at >= month.start && 
            a.created_at <= month.end && 
            a.gender === 'male'
          ).length || 0
        ),
        female: months.map(month => 
          appointments?.filter(a => 
            a.created_at >= month.start && 
            a.created_at <= month.end && 
            a.gender === 'female'
          ).length || 0
        ),
        total: months.map(month => 
          appointments?.filter(a => 
            a.created_at >= month.start && 
            a.created_at <= month.end
          ).length || 0
        )
      };
      
      // Calculate growth rate
      const currentMonthCount = monthlyTrends.total[monthlyTrends.total.length - 1] || 0;
      const previousMonthCount = monthlyTrends.total[monthlyTrends.total.length - 2] || 1; // Avoid division by zero
      const growthRate = ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100;
      
      // Process peak hours
      const hourCounts: Record<string, number> = {};
      appointments?.forEach(appointment => {
        if (appointment.appointment_time) {
          const hour = appointment.appointment_time.split(':')[0];
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });
      
      const peakHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
      
      // Process weekday distribution
      const weekdayCounts: Record<string, number> = {
        'Sunday': 0,
        'Monday': 0,
        'Tuesday': 0,
        'Wednesday': 0,
        'Thursday': 0,
        'Friday': 0,
        'Saturday': 0
      };
      
      appointments?.forEach(appointment => {
        if (appointment.appointment_date) {
          const date = new Date(appointment.appointment_date);
          const day = format(date, 'EEEE');
          weekdayCounts[day] = (weekdayCounts[day] || 0) + 1;
        }
      });
      
      const weekdayDistribution = Object.entries(weekdayCounts)
        .map(([day, count]) => ({ day, count }));
      
      // Calculate conversion rate (simulated for demo)
      // In a real app, you would track website visits vs. actual bookings
      const conversionRate = 65 + Math.random() * 15; // Random between 65-80%
      
      // Calculate retention rate (returning patients)
      const uniqueCaseIds = new Set();
      const returningCaseIds = new Set();
      
      appointments?.forEach(appointment => {
        if (uniqueCaseIds.has(appointment.case_id)) {
          returningCaseIds.add(appointment.case_id);
        } else {
          uniqueCaseIds.add(appointment.case_id);
        }
      });
      
      const retentionRate = uniqueCaseIds.size > 0 
        ? (returningCaseIds.size / uniqueCaseIds.size) * 100 
        : 0;
      
      // Simulate appointment duration data
      const appointmentDuration = {
        labels: ['15 min', '30 min', '45 min', '60 min', '75+ min'],
        data: [15, 45, 25, 10, 5] // Percentages
      };
      
      // Simulate patient age distribution
      const patientAgeDistribution = {
        labels: ['0-18', '19-30', '31-45', '46-60', '61+'],
        data: [10, 25, 35, 20, 10] // Percentages
      };
      
      setData({
        monthlyTrends,
        peakHours,
        weekdayDistribution,
        growthRate,
        conversionRate,
        retentionRate,
        appointmentDuration,
        patientAgeDistribution
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
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

  const renderMonthlyTrendsChart = () => {
    if (!data) return null;
    
    const chartData = {
      labels: data.monthlyTrends.labels,
      datasets: [
        {
          label: 'Total',
          data: data.monthlyTrends.total,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: 'Male',
          data: data.monthlyTrends.male,
          borderColor: 'rgba(37, 99, 235, 1)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.4,
          pointBackgroundColor: 'rgba(37, 99, 235, 1)',
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Female',
          data: data.monthlyTrends.female,
          borderColor: 'rgba(236, 72, 153, 1)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.4,
          pointBackgroundColor: 'rgba(236, 72, 153, 1)',
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };
    
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            font: {
              size: 12
            }
          }
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
          callbacks: {
            label: function(context: any) {
              const label = context.dataset.label || '';
              const value = context.raw || 0;
              return `${label}: ${value} appointments`;
            }
          }
        }
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
          title: {
            display: true,
            text: 'Number of Appointments',
            color: 'rgba(107, 114, 128, 1)',
            font: {
              size: 12,
              weight: 'normal'
            }
          }
        },
        x: {
          ticks: {
            color: 'rgba(107, 114, 128, 1)',
          },
          grid: {
            display: false,
          },
          title: {
            display: true,
            text: 'Month',
            color: 'rgba(107, 114, 128, 1)',
            font: {
              size: 12,
              weight: 'normal'
            }
          }
        }
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      maintainAspectRatio: false,
    };
    
    return <Line data={chartData} options={chartOptions} height={300} />;
  };

  const renderPeakHoursChart = () => {
    if (!data) return null;
    
    const chartData = {
      labels: data.peakHours.map(item => item.hour),
      datasets: [
        {
          label: 'Appointments',
          data: data.peakHours.map(item => item.count),
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: 'rgba(99, 102, 241, 1)',
        }
      ]
    };
    
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: false,
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
          displayColors: false,
          callbacks: {
            label: function(context: any) {
              const value = context.raw || 0;
              return `${value} appointments`;
            }
          }
        }
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
          title: {
            display: true,
            text: 'Number of Appointments',
            color: 'rgba(107, 114, 128, 1)',
            font: {
              size: 12,
              weight: 'normal'
            }
          }
        },
        x: {
          ticks: {
            color: 'rgba(107, 114, 128, 1)',
          },
          grid: {
            display: false,
          },
          title: {
            display: true,
            text: 'Hour of Day',
            color: 'rgba(107, 114, 128, 1)',
            font: {
              size: 12,
              weight: 'normal'
            }
          }
        }
      },
      maintainAspectRatio: false,
    };
    
    return <Bar data={chartData} options={chartOptions} height={300} />;
  };

  const renderWeekdayDistributionChart = () => {
    if (!data) return null;
    
    // Reorder days to start with Monday
    const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const orderedData = orderedDays.map(day => {
      const found = data.weekdayDistribution.find(item => item.day === day);
      return found ? found.count : 0;
    });
    
    const chartData = {
      labels: orderedDays,
      datasets: [
        {
          label: 'Appointments',
          data: orderedData,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)', // Monday
            'rgba(16, 185, 129, 0.8)', // Tuesday
            'rgba(139, 92, 246, 0.8)', // Wednesday
            'rgba(245, 158, 11, 0.8)', // Thursday
            'rgba(236, 72, 153, 0.8)', // Friday
            'rgba(99, 102, 241, 0.8)', // Saturday
            'rgba(239, 68, 68, 0.8)'   // Sunday
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
        }
      ]
    };
    
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: false,
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
          displayColors: false,
          callbacks: {
            label: function(context: any) {
              const value = context.raw || 0;
              const total = orderedData.reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return `${value} appointments (${percentage}%)`;
            }
          }
        }
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
          title: {
            display: true,
            text: 'Number of Appointments',
            color: 'rgba(107, 114, 128, 1)',
            font: {
              size: 12,
              weight: 'normal'
            }
          }
        },
        x: {
          ticks: {
            color: 'rgba(107, 114, 128, 1)',
          },
          grid: {
            display: false,
          },
          title: {
            display: true,
            text: 'Day of Week',
            color: 'rgba(107, 114, 128, 1)',
            font: {
              size: 12,
              weight: 'normal'
            }
          }
        }
      },
      maintainAspectRatio: false,
    };
    
    return <Bar data={chartData} options={chartOptions} height={300} />;
  };

  const renderAppointmentDurationChart = () => {
    if (!data) return null;
    
    const chartData = {
      labels: data.appointmentDuration.labels,
      datasets: [
        {
          label: 'Percentage',
          data: data.appointmentDuration.data,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(236, 72, 153, 0.8)',
          ],
          borderColor: [
            'rgb(37, 99, 235)',
            'rgb(5, 150, 105)',
            'rgb(124, 58, 237)',
            'rgb(217, 119, 6)',
            'rgb(219, 39, 119)',
          ],
          borderWidth: 1,
          borderRadius: 6,
        }
      ]
    };
    
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: false,
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
          displayColors: false,
          callbacks: {
            label: function(context: any) {
              const value = context.raw || 0;
              return `${value}% of appointments`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value: any) {
              return value + '%';
            },
            color: 'rgba(107, 114, 128, 1)',
          },
          grid: {
            color: 'rgba(243, 244, 246, 1)',
            drawBorder: false,
          },
          title: {
            display: true,
            text: 'Percentage of Appointments',
            color: 'rgba(107, 114, 128, 1)',
            font: {
              size: 12,
              weight: 'normal'
            }
          }
        },
        x: {
          ticks: {
            color: 'rgba(107, 114, 128, 1)',
          },
          grid: {
            display: false,
          },
          title: {
            display: true,
            text: 'Duration',
            color: 'rgba(107, 114, 128, 1)',
            font: {
              size: 12,
              weight: 'normal'
            }
          }
        }
      },
      maintainAspectRatio: false,
    };
    
    return <Bar data={chartData} options={chartOptions} height={300} />;
  };

  const renderDemographicsChart = () => {
    if (!data) return null;
    
    const chartData = {
      labels: data.patientAgeDistribution.labels,
      datasets: [
        {
          label: 'Percentage',
          data: data.patientAgeDistribution.data,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(236, 72, 153, 0.8)',
          ],
          borderColor: [
            'rgb(37, 99, 235)',
            'rgb(5, 150, 105)',
            'rgb(124, 58, 237)',
            'rgb(217, 119, 6)',
            'rgb(219, 39, 119)',
          ],
          borderWidth: 1,
          borderRadius: 6,
        }
      ]
    };
    
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: false,
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
          displayColors: false,
          callbacks: {
            label: function(context: any) {
              const value = context.raw || 0;
              return `${value}% of patients`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value: any) {
              return value + '%';
            },
            color: 'rgba(107, 114, 128, 1)',
          },
          grid: {
            color: 'rgba(243, 244, 246, 1)',
            drawBorder: false,
          },
          title: {
            display: true,
            text: 'Percentage of Patients',
            color: 'rgba(107, 114, 128, 1)',
            font: {
              size: 12,
              weight: 'normal'
            }
          }
        },
        x: {
          ticks: {
            color: 'rgba(107, 114, 128, 1)',
          },
          grid: {
            display: false,
          },
          title: {
            display: true,
            text: 'Age Group',
            color: 'rgba(107, 114, 128, 1)',
            font: {
              size: 12,
              weight: 'normal'
            }
          }
        }
      },
      maintainAspectRatio: false,
    };
    
    return <Bar data={chartData} options={chartOptions} height={300} />;
  };

  if (isLoading) {
    return (
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-md border border-gray-100"
        variants={cardVariants}
      >
        <h3 className="text-lg font-medium text-gray-800 mb-4">Advanced Analytics</h3>
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
        <h3 className="text-lg font-medium text-gray-800">Advanced Analytics</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setTimeRange('3m')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeRange === '3m' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              3 Months
            </button>
            <button
              onClick={() => setTimeRange('6m')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeRange === '6m' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setTimeRange('1y')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeRange === '1y' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              1 Year
            </button>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedView('monthly')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                selectedView === 'monthly' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Trends</span>
            </button>
            <button
              onClick={() => setSelectedView('hourly')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                selectedView === 'hourly' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Hours</span>
            </button>
            <button
              onClick={() => setSelectedView('weekday')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                selectedView === 'weekday' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Days</span>
            </button>
            <button
              onClick={() => setSelectedView('duration')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                selectedView === 'duration' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Duration</span>
            </button>
            <button
              onClick={() => setSelectedView('demographics')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                selectedView === 'demographics' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Demographics</span>
            </button>
          </div>
        </div>
      </div>
      
      {data && (
        <>
          <div className="h-[300px] mb-6">
            {selectedView === 'monthly' && renderMonthlyTrendsChart()}
            {selectedView === 'hourly' && renderPeakHoursChart()}
            {selectedView === 'weekday' && renderWeekdayDistributionChart()}
            {selectedView === 'duration' && renderAppointmentDurationChart()}
            {selectedView === 'demographics' && renderDemographicsChart()}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedView === 'monthly' && (
              <>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Total Appointments</p>
                  <p className="text-xl font-bold text-blue-600">
                    {data.monthlyTrends.total.reduce((sum, val) => sum + val, 0)}
                  </p>
                </div>
                <div className={`${data.growthRate >= 0 ? 'bg-green-50' : 'bg-red-50'} p-3 rounded-lg text-center`}>
                  <p className="text-sm text-gray-600">Monthly Growth</p>
                  <p className={`text-xl font-bold ${data.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.growthRate.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-xl font-bold text-purple-600">
                    {data.conversionRate.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Retention Rate</p>
                  <p className="text-xl font-bold text-amber-600">
                    {data.retentionRate.toFixed(1)}%
                  </p>
                </div>
              </>
            )}
            
            {selectedView === 'hourly' && (
              <>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Peak Hour</p>
                  <p className="text-xl font-bold text-blue-600">
                    {data.peakHours.length > 0 
                      ? data.peakHours.reduce((max, hour) => hour.count > max.count ? hour : max, data.peakHours[0]).hour
                      : 'N/A'
                    }
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Slowest Hour</p>
                  <p className="text-xl font-bold text-green-600">
                    {data.peakHours.length > 0 
                      ? data.peakHours.reduce((min, hour) => hour.count < min.count ? hour : min, data.peakHours[0]).hour
                      : 'N/A'
                    }
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Morning Ratio</p>
                  <p className="text-xl font-bold text-purple-600">
                    {data.peakHours.length > 0 
                      ? (() => {
                          const morningHours = data.peakHours.filter(h => parseInt(h.hour) < 12).reduce((sum, h) => sum + h.count, 0);
                          const total = data.peakHours.reduce((sum, h) => sum + h.count, 0);
                          return total > 0 ? `${Math.round((morningHours / total) * 100)}%` : '0%';
                        })()
                      : '0%'
                    }
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Evening Ratio</p>
                  <p className="text-xl font-bold text-amber-600">
                    {data.peakHours.length > 0 
                      ? (() => {
                          const eveningHours = data.peakHours.filter(h => parseInt(h.hour) >= 17).reduce((sum, h) => sum + h.count, 0);
                          const total = data.peakHours.reduce((sum, h) => sum + h.count, 0);
                          return total > 0 ? `${Math.round((eveningHours / total) * 100)}%` : '0%';
                        })()
                      : '0%'
                    }
                  </p>
                </div>
              </>
            )}
            
            {selectedView === 'weekday' && (
              <>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Busiest Day</p>
                  <p className="text-xl font-bold text-blue-600">
                    {data.weekdayDistribution.length > 0 
                      ? data.weekdayDistribution.reduce((max, day) => day.count > max.count ? day : max, data.weekdayDistribution[0]).day
                      : 'N/A'
                    }
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Quietest Day</p>
                  <p className="text-xl font-bold text-green-600">
                    {data.weekdayDistribution.length > 0 
                      ? data.weekdayDistribution.reduce((min, day) => day.count < min.count ? day : min, data.weekdayDistribution[0]).day
                      : 'N/A'
                    }
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Weekday Ratio</p>
                  <p className="text-xl font-bold text-purple-600">
                    {data.weekdayDistribution.length > 0 
                      ? (() => {
                          const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                          const weekdayCount = data.weekdayDistribution
                            .filter(d => weekdays.includes(d.day))
                            .reduce((sum, d) => sum + d.count, 0);
                          const total = data.weekdayDistribution.reduce((sum, d) => sum + d.count, 0);
                          return total > 0 ? `${Math.round((weekdayCount / total) * 100)}%` : '0%';
                        })()
                      : '0%'
                    }
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Weekend Ratio</p>
                  <p className="text-xl font-bold text-amber-600">
                    {data.weekdayDistribution.length > 0 
                      ? (() => {
                          const weekends = ['Saturday', 'Sunday'];
                          const weekendCount = data.weekdayDistribution
                            .filter(d => weekends.includes(d.day))
                            .reduce((sum, d) => sum + d.count, 0);
                          const total = data.weekdayDistribution.reduce((sum, d) => sum + d.count, 0);
                          return total > 0 ? `${Math.round((weekendCount / total) * 100)}%` : '0%';
                        })()
                      : '0%'
                    }
                  </p>
                </div>
              </>
            )}
            
            {selectedView === 'duration' && (
              <>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Most Common</p>
                  <p className="text-xl font-bold text-blue-600">
                    {data.appointmentDuration.labels[
                      data.appointmentDuration.data.indexOf(Math.max(...data.appointmentDuration.data))
                    ]}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Avg. Duration</p>
                  <p className="text-xl font-bold text-green-600">35 min</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Short Appts</p>
                  <p className="text-xl font-bold text-purple-600">
                    {data.appointmentDuration.data[0] + data.appointmentDuration.data[1]}%
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Long Appts</p>
                  <p className="text-xl font-bold text-amber-600">
                    {data.appointmentDuration.data[3] + data.appointmentDuration.data[4]}%
                  </p>
                </div>
              </>
            )}
            
            {selectedView === 'demographics' && (
              <>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Largest Group</p>
                  <p className="text-xl font-bold text-blue-600">
                    {data.patientAgeDistribution.labels[
                      data.patientAgeDistribution.data.indexOf(Math.max(...data.patientAgeDistribution.data))
                    ]}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Youth Ratio</p>
                  <p className="text-xl font-bold text-green-600">
                    {data.patientAgeDistribution.data[0]}%
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Adult Ratio</p>
                  <p className="text-xl font-bold text-purple-600">
                    {data.patientAgeDistribution.data[1] + 
                     data.patientAgeDistribution.data[2] + 
                     data.patientAgeDistribution.data[3]}%
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Senior Ratio</p>
                  <p className="text-xl font-bold text-amber-600">
                    {data.patientAgeDistribution.data[4]}%
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      )}
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="h-5 w-5 text-blue-500" />
          <p className="text-sm">
            <span className="font-medium">Note:</span> Some demographic data is simulated for demonstration purposes. In a production environment, this would be based on actual patient data.
          </p>
        </div>
      </div>
    </motion.div>
  );
}