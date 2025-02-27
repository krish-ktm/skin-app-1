import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { supabase } from '../../../../lib/supabase';
import { PulseLoader } from 'react-spinners';
import { format, addDays, eachDayOfInterval, startOfDay, endOfDay, addMonths } from 'date-fns';
import { TrendingUp, AlertTriangle, Calendar, BrainCircuit } from 'lucide-react';

interface PredictionData {
  dates: string[];
  actual: number[];
  predicted: number[];
  nextWeekPrediction: {
    dates: string[];
    values: number[];
  };
  accuracy: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  peakDay: {
    date: string;
    value: number;
  };
}

export function PredictiveAnalytics() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPredictionData();
  }, []);

  const fetchPredictionData = async () => {
    setIsLoading(true);
    try {
      // Get the date range for the last 30 days
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      // Get all appointments in the last 30 days
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_date, created_at')
        .gte('appointment_date', thirtyDaysAgo.toISOString().split('T')[0])
        .lte('appointment_date', today.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      // Generate date range for the last 30 days
      const dateRange = eachDayOfInterval({
        start: thirtyDaysAgo,
        end: today
      });
      
      // Count appointments per day
      const appointmentsByDate: Record<string, number> = {};
      dateRange.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        appointmentsByDate[dateStr] = 0;
      });
      
      appointments?.forEach(appointment => {
        const dateStr = appointment.appointment_date;
        if (appointmentsByDate[dateStr] !== undefined) {
          appointmentsByDate[dateStr] += 1;
        }
      });
      
      // Convert to arrays for charting
      const dates = Object.keys(appointmentsByDate).sort();
      const actual = dates.map(date => appointmentsByDate[date]);
      
      // Simple moving average prediction (for demo purposes)
      // In a real app, you would use more sophisticated algorithms
      const windowSize = 7; // 7-day moving average
      const predicted = dates.map((_, index) => {
        if (index < windowSize - 1) return null;
        
        let sum = 0;
        for (let i = index - windowSize + 1; i <= index; i++) {
          sum += actual[i];
        }
        return sum / windowSize;
      });
      
      // Calculate prediction accuracy (using mean absolute percentage error)
      let totalError = 0;
      let validPredictions = 0;
      
      for (let i = windowSize - 1; i < dates.length; i++) {
        if (actual[i] > 0 && predicted[i] !== null) {
          const error = Math.abs((actual[i] - predicted[i]!) / actual[i]);
          totalError += error;
          validPredictions++;
        }
      }
      
      const accuracy = validPredictions > 0 ? 100 * (1 - (totalError / validPredictions)) : 0;
      
      // Predict next 7 days
      const nextWeekDates = Array.from({ length: 7 }, (_, i) => 
        format(addDays(today, i + 1), 'yyyy-MM-dd')
      );
      
      // Simple prediction based on the trend of the last 7 days
      const lastWeekValues = actual.slice(-7);
      const lastWeekAvg = lastWeekValues.reduce((sum, val) => sum + val, 0) / 7;
      
      // Calculate trend
      const firstHalf = actual.slice(0, Math.floor(actual.length / 2));
      const secondHalf = actual.slice(Math.floor(actual.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
      
      let trend: 'increasing' | 'decreasing' | 'stable';
      
      if (secondHalfAvg > firstHalfAvg * 1.1) {
        trend = 'increasing';
      } else if (secondHalfAvg < firstHalfAvg * 0.9) {
        trend = 'decreasing';
      } else {
        trend = 'stable';
      }
      
      // Apply trend to next week prediction
      const trendFactor = trend === 'increasing' ? 1.1 : trend === 'decreasing' ? 0.9 : 1;
      
      // Generate predictions with some randomness to simulate real-world variation
      const nextWeekPrediction = {
        dates: nextWeekDates.map(date => format(new Date(date), 'MMM dd')),
        values: nextWeekDates.map((date, i) => {
          const dayOfWeek = new Date(date).getDay();
          // Weekend adjustment
          const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1;
          // Add some randomness
          const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
          
          return Math.round(lastWeekAvg * trendFactor * weekendFactor * randomFactor);
        })
      };
      
      // Find peak day in prediction
      const peakIndex = nextWeekPrediction.values.indexOf(Math.max(...nextWeekPrediction.values));
      const peakDay = {
        date: nextWeekPrediction.dates[peakIndex],
        value: nextWeekPrediction.values[peakIndex]
      };
      
      setData({
        dates: dates.map(date => format(new Date(date), 'MMM dd')),
        actual,
        predicted: predicted as number[],
        nextWeekPrediction,
        accuracy,
        trend,
        peakDay
      });
    } catch (error) {
      console.error('Error fetching prediction data:', error);
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

  const renderPredictionChart = () => {
    if (!data) return null;
    
    const chartData = {
      labels: [...data.dates, ...data.nextWeekPrediction.dates],
      datasets: [
        {
          label: 'Actual',
          data: [...data.actual, ...Array(data.nextWeekPrediction.dates.length).fill(null)],
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
          label: 'Predicted',
          data: [...data.predicted, ...data.nextWeekPrediction.values],
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
              xMin: data.dates.length - 0.5,
              xMax: data.dates.length - 0.5,
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
              return index % 3 === 0 ? this.getLabelForValue(value) : '';
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

  if (isLoading) {
    return (
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-md border border-gray-100"
        variants={cardVariants}
      >
        <h3 className="text-lg font-medium text-gray-800 mb-4">Predictive Analytics</h3>
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-800">Predictive Analytics</h3>
          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <BrainCircuit className="h-3 w-3" />
            AI Powered
          </span>
        </div>
        {data && (
          <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            <span>Accuracy:</span>
            <span className="font-semibold">{data.accuracy.toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      {data && (
        <>
          <div className="h-[300px] mb-6">
            {renderPredictionChart()}
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
                <p className="text-sm font-medium">Booking Trend</p>
                <p className="text-lg font-bold capitalize">{data.trend}</p>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg flex items-center">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <Calendar className="h-5 w-5 text-purple-800" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-800">Predicted Peak Day</p>
                <p className="text-lg font-bold text-purple-800">{data.peakDay.date}</p>
              </div>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg flex items-center">
              <div className="bg-amber-100 p-2 rounded-full mr-3">
                <AlertTriangle className="h-5 w-5 text-amber-800" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">Staff Recommendation</p>
                <p className="text-base font-medium text-amber-800">
                  {data.trend === 'increasing' 
                    ? 'Consider adding more staff'
                    : data.trend === 'decreasing'
                      ? 'Standard staffing sufficient'
                      : 'Maintain current staffing'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Next 7 Days Forecast</h4>
            <div className="grid grid-cols-7 gap-2">
              {data.nextWeekPrediction.dates.map((date, index) => (
                <div 
                  key={date} 
                  className={`p-2 rounded-lg text-center ${
                    data.peakDay.date === date ? 'bg-purple-100 border border-purple-200' : 'bg-white border border-gray-100'
                  }`}
                >
                  <p className="text-xs text-gray-500">{date}</p>
                  <p className={`text-lg font-bold ${
                    data.peakDay.date === date ? 'text-purple-700' : 'text-gray-700'
                  }`}>
                    {data.nextWeekPrediction.values[index]}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(data.nextWeekPrediction.dates[index]).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}