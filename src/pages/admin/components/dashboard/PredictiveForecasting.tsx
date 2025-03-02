import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { supabase } from '../../../../lib/supabase';
import { PulseLoader } from 'react-spinners';
import { format, addDays, addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { TrendingUp, AlertTriangle, Calendar, BrainCircuit, Users, Clock } from 'lucide-react';
import { TimeRangeSelector, TimeRange, getTimeRangeDate } from './TimeRangeSelector';
import { useAnalytics } from './AnalyticsContext';

interface PredictiveForecastingProps {}

interface ForecastData {
  // Historical data
  historicalDates: string[];
  historicalCounts: number[];
  
  // Forecast data
  forecastDates: string[];
  forecastCounts: number[];
  
  // Insights
  peakDay: {
    date: string;
    count: number;
  };
  quietestDay: {
    date: string;
    count: number;
  };
  averageDaily: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  
  // Staffing recommendations
  staffingRecommendations: {
    date: string;
    staff: number;
    reason: string;
  }[];
}

export function PredictiveForecasting({}: PredictiveForecastingProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [forecastRange, setForecastRange] = useState<'1w' | '2w' | '4w'>('2w');
  const [data, setData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { refreshTrigger } = useAnalytics();
  
  const startDate = getTimeRangeDate(timeRange);
  const endDate = new Date();

  useEffect(() => {
    fetchForecastData();
  }, [timeRange, forecastRange, refreshTrigger]);

  const fetchForecastData = async () => {
    setIsLoading(true);
    try {
      // Get historical appointment data
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_date, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (error) throw error;
      
      // Process historical data by day
      const appointmentsByDate: Record<string, number> = {};
      
      appointments?.forEach(appointment => {
        const dateStr = appointment.appointment_date;
        appointmentsByDate[dateStr] = (appointmentsByDate[dateStr] || 0) + 1;
      });
      
      // Sort dates and prepare historical data arrays
      const sortedDates = Object.keys(appointmentsByDate).sort();
      const historicalDates = sortedDates.map(date => format(new Date(date), 'MMM dd'));
      const historicalCounts = sortedDates.map(date => appointmentsByDate[date]);
      
      // Generate forecast data
      // In a real application, this would use a more sophisticated algorithm
      // For this demo, we'll use a simple moving average with some randomness
      
      // Determine forecast period
      let forecastDays = 14; // default 2 weeks
      if (forecastRange === '1w') forecastDays = 7;
      if (forecastRange === '4w') forecastDays = 28;
      
      // Calculate average appointments per day from historical data
      const totalAppointments = historicalCounts.reduce((sum, count) => sum + count, 0);
      const averageDaily = totalAppointments / Math.max(historicalCounts.length, 1);
      
      // Determine trend by comparing first and second half of historical data
      const halfIndex = Math.floor(historicalCounts.length / 2);
      const firstHalf = historicalCounts.slice(0, halfIndex);
      const secondHalf = historicalCounts.slice(halfIndex);
      
      const firstHalfAvg = firstHalf.length > 0 
        ? firstHalf.reduce((sum, count) => sum + count, 0) / firstHalf.length 
        : 0;
      const secondHalfAvg = secondHalf.length > 0 
        ? secondHalf.reduce((sum, count) => sum + count, 0) / secondHalf.length 
        : 0;
      
      let trend: 'increasing' | 'decreasing' | 'stable';
      let trendFactor = 1;
      
      if (secondHalfAvg > firstHalfAvg * 1.1) {
        trend = 'increasing';
        trendFactor = 1.1;
      } else if (secondHalfAvg < firstHalfAvg * 0.9) {
        trend = 'decreasing';
        trendFactor = 0.9;
      } else {
        trend = 'stable';
        trendFactor = 1;
      }
      
      // Generate forecast dates
      const forecastDates: string[] = [];
      const forecastCounts: number[] = [];
      
      let currentForecastDate = new Date();
      
      for (let i = 0; i < forecastDays; i++) {
        currentForecastDate = addDays(currentForecastDate, 1);
        const dateStr = format(currentForecastDate, 'MMM dd');
        forecastDates.push(dateStr);
        
        // Apply day of week patterns
        const dayOfWeek = currentForecastDate.getDay(); // 0 = Sunday, 6 = Saturday
        let dayFactor = 1;
        
        // Weekend adjustment
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          dayFactor = 0.7; // Less appointments on weekends
        } else if (dayOfWeek === 1 || dayOfWeek === 5) {
          dayFactor = 1.2; // More appointments on Monday and Friday
        } else if (dayOfWeek === 3) {
          dayFactor = 1.1; // Slightly more on Wednesday
        }
        
        // Apply some randomness to make it look realistic
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        
        // Calculate predicted count
        const predictedCount = Math.round(averageDaily * trendFactor * dayFactor * randomFactor);
        forecastCounts.push(predictedCount);
      }
      
      // Find peak and quietest days
      const peakIndex = forecastCounts.indexOf(Math.max(...forecastCounts));
      const quietestIndex = forecastCounts.indexOf(Math.min(...forecastCounts));
      
      const peakDay = {
        date: forecastDates[peakIndex],
        count: forecastCounts[peakIndex]
      };
      
      const quietestDay = {
        date: forecastDates[quietestIndex],
        count: forecastCounts[quietestIndex]
      };
      
      // Calculate confidence score (simplified)
      // In a real app, this would be based on model performance metrics
      const confidence = 70 + Math.random() * 15; // Random between 70-85%
      
      // Generate staffing recommendations
      const staffingRecommendations = [];
      
      // Group by week for staffing recommendations
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(weekStart);
      const nextWeekStart = addWeeks(weekStart, 1);
      const nextWeekEnd = endOfWeek(nextWeekStart);
      
      // Current week recommendation
      staffingRecommendations.push({
        date: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`,
        staff: Math.ceil(averageDaily / 3) + (trend === 'increasing' ? 1 : 0),
        reason: trend === 'increasing' 
          ? 'Increasing appointment trend detected' 
          : trend === 'decreasing'
            ? 'Decreasing appointment trend detected'
            : 'Stable appointment pattern'
      });
      
      // Next week recommendation
      staffingRecommendations.push({
        date: `${format(nextWeekStart, 'MMM dd')} - ${format(nextWeekEnd, 'MMM dd')}`,
        staff: Math.ceil(averageDaily / 3) + (trend === 'increasing' ? 2 : trend === 'decreasing' ? -1 : 0),
        reason: peakDay.count > averageDaily * 1.3
          ? `Peak day (${peakDay.date}) requires additional staffing`
          : 'Standard staffing recommended'
      });
      
      setData({
        historicalDates,
        historicalCounts,
        forecastDates,
        forecastCounts,
        peakDay,
        quietestDay,
        averageDaily,
        trend,
        confidence,
        staffingRecommendations
      });
    } catch (error) {
      console.error('Error fetching forecast data:', error);
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

  const renderForecastChart = () => {
    if (!data) return null;
    
    const chartData = {
      labels: [...data.historicalDates, ...data.forecastDates],
      datasets: [
        {
          label: 'Historical',
          data: [...data.historicalCounts, ...Array(data.forecastDates.length).fill(null)],
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Forecast',
          data: [...Array(data.historicalDates.length).fill(null), ...data.forecastCounts],
          borderColor: 'rgba(139, 92, 246, 1)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderDash: [5, 5],
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: 'rgba(139, 92, 246, 1)',
          pointBorderColor: '#fff',
          pointRadius: 3,
          pointHoverRadius: 5,
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
              const value = context.raw !== null ? context.raw : 'No data';
              return `${label}: ${value}`;
            }
          }
        },
        annotation: {
          annotations: {
            line1: {
              type: 'line',
              xMin: data.historicalDates.length - 0.5,
              xMax: data.historicalDates.length - 0.5,
              borderColor: 'rgba(156, 163, 175, 0.5)',
              borderWidth: 2,
              borderDash: [6, 6],
              label: {
                display: true,
                content: 'Today',
                position: 'start',
                backgroundColor: 'rgba(156, 163, 175, 0.7)',
                font: {
                  size: 11
                }
              }
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
            maxRotation: 45,
            minRotation: 45,
            callback: function(value: any, index: number) {
              // Show fewer labels for readability
              const allLabels = [...data.historicalDates, ...data.forecastDates];
              return index % 3 === 0 ? allLabels[index] : '';
            }
          },
          grid: {
            display: false,
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

  // Get time range label for display
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '7d': return 'Based on last 7 days';
      case '30d': return 'Based on last 30 days';
      case '90d': return 'Based on last 90 days';
      case '6m': return 'Based on last 6 months';
      case '1y': return 'Based on last year';
      case 'all': return 'Based on all historical data';
      default: return 'Based on selected period';
    }
  };

  if (isLoading) {
    return (
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-md border border-gray-100"
        variants={cardVariants}
      >
        <h3 className="text-lg font-medium text-gray-800 mb-4">Predictive Appointment Forecasting</h3>
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
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-800">Predictive Appointment Forecasting</h3>
          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <BrainCircuit className="h-3 w-3" />
            AI Powered
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <TimeRangeSelector 
            selectedRange={timeRange}
            onChange={setTimeRange}
          />
          
          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setForecastRange('1w')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                forecastRange === '1w' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              1 Week
            </button>
            <button
              onClick={() => setForecastRange('2w')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                forecastRange === '2w' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              2 Weeks
            </button>
            <button
              onClick={() => setForecastRange('4w')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                forecastRange === '4w' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              4 Weeks
            </button>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">{getTimeRangeLabel()}</p>
      
      {data && (
        <>
          <div className="h-[300px] mb-6">
            {renderForecastChart()}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className={`p-4 rounded-lg flex items-center ${
              data.trend === 'increasing' 
                ? 'bg-green-50 text-green-800' 
                : data.trend === 'decreasing' 
                  ? 'bg-red-50 text-red-800' 
                  : 'bg-blue-50 text-blue-800'
            }`}>
              <div className={`p-2 rounded-full mr-3 ${
                data.trend === 'increasing' 
                  ? 'bg-green-100' 
                  : data.trend === 'decreasing' 
                    ? 'bg-red-100' 
                    : 'bg-blue-100'
              }`}>
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Appointment Trend</p>
                <p className="text-lg font-bold capitalize">{data.trend}</p>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg flex items-center">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <Calendar className="h-5 w-5 text-purple-800" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-800">Predicted Peak Day</p>
                <p className="text-lg font-bold text-purple-800">{data.peakDay.date} ({data.peakDay.count})</p>
              </div>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg flex items-center">
              <div className="bg-amber-100 p-2 rounded-full mr-3">
                <AlertTriangle className="h-5 w-5 text-amber-800" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">Forecast Confidence</p>
                <p className="text-lg font-bold text-amber-800">{data.confidence.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Staffing Recommendations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.staffingRecommendations.map((rec, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700">{rec.date}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="bg-blue-100 text-blue-800 font-bold text-lg w-10 h-10 rounded-full flex items-center justify-center">
                      {rec.staff}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{rec.reason}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {rec.staff === 1 ? '1 staff member' : `${rec.staff} staff members`} recommended
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-600">Avg. Daily Appointments</p>
              <p className="text-xl font-bold text-blue-600">{data.averageDaily.toFixed(1)}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-600">Quietest Day</p>
              <p className="text-xl font-bold text-green-600">{data.quietestDay.date}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-600">Forecast Period</p>
              <p className="text-xl font-bold text-purple-600">
                {forecastRange === '1w' ? '1 Week' : forecastRange === '2w' ? '2 Weeks' : '4 Weeks'}
              </p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-600">Data Points</p>
              <p className="text-xl font-bold text-amber-600">{data.historicalCounts.length}</p>
            </div>
          </div>
        </>
      )}
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="h-5 w-5 text-blue-500" />
          <p className="text-sm">
            <span className="font-medium">Note:</span> This forecast is based on historical booking patterns and may not account for external factors like holidays or special events.
          </p>
        </div>
      </div>
    </motion.div>
  );
}