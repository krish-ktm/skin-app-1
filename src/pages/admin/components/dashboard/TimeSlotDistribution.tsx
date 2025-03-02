import React from 'react';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { useAnalytics } from './AnalyticsContext';

interface TimeSlotDistributionProps {
  timeSlotDistribution: {
    time: string;
    count: number;
  }[];
}

export function TimeSlotDistribution({ timeSlotDistribution }: TimeSlotDistributionProps) {
  const { timeRange } = useAnalytics();
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

  const formatTimeSlot = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
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
          'rgba(249, 168, 212, 1)',
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
      <h3 className="text-lg font-medium text-gray-800 mb-1">Popular Time Slots</h3>
      <p className="text-sm text-gray-500 mb-4">{getTimeRangeLabel()} booking distribution</p>
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
  );
}