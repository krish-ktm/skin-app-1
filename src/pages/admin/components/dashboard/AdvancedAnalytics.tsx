import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import { supabase } from '../../../../lib/supabase';
import { PulseLoader } from 'react-spinners';
import { format, subMonths, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { TrendingUp, Calendar, BarChart4, Activity } from 'lucide-react';

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
}

export function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'monthly' | 'hourly' | 'weekday'>('monthly');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Get the date range for the last 6 months
      const endDate = new Date();
      const startDate = subMonths(endDate, 5); // 6 months including current
      
      // Get all appointments
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_date, appointment_time, gender, created_at')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      // Process monthly trends
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(endDate, 5 - i);
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
      const currentMonthCount = monthlyTrends.total[5] || 0;
      const previousMonthCount = monthlyTrends.total[4] || 1; // Avoid division by zero
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
      
      setData({
        monthlyTrends,
        peakHours,
        weekdayDistribution,
        growthRate
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
            <span className="hidden sm:inline">Monthly</span>
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
            <span className="hidden sm:inline">Hourly</span>
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
            <span className="hidden sm:inline">Weekday</span>
          </button>
        </div>
      </div>
      
      {data && (
        <>
          <div className="h-[300px] mb-6">
            {selectedView === 'monthly' && renderMonthlyTrendsChart()}
            {selectedView === 'hourly' && renderPeakHoursChart()}
            {selectedView === 'weekday' && renderWeekdayDistributionChart()}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-600">6-Month Total</p>
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
              <p className="text-sm text-gray-600">Peak Hour</p>
              <p className="text-xl font-bold text-purple-600">
                {data.peakHours.length > 0 
                  ? data.peakHours.reduce((max, hour) => hour.count > max.count ? hour : max, data.peakHours[0]).hour
                  : 'N/A'
                }
              </p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-600">Busiest Day</p>
              <p className="text-xl font-bold text-amber-600">
                {data.weekdayDistribution.length > 0 
                  ? data.weekdayDistribution.reduce((max, day) => day.count > max.count ? day : max, data.weekdayDistribution[0]).day
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}