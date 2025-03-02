import React from 'react';
import { motion } from 'framer-motion';
import { Doughnut } from 'react-chartjs-2';
import { useAnalytics } from './AnalyticsContext';

interface GenderDistributionProps {
  genderDistribution: {
    male: number;
    female: number;
  };
}

export function GenderDistribution({ genderDistribution }: GenderDistributionProps) {
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
        enabled: true,
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
      <h3 className="text-lg font-medium text-gray-800 mb-1 flex items-center">
        <span className="mr-2">Gender Distribution</span>
      </h3>
      <p className="text-sm text-gray-500 mb-3">
        {getTimeRangeLabel()}: {genderDistribution.male + genderDistribution.female > 0 ? 
          `${genderDistribution.male + genderDistribution.female} patients` : 
          'No data available'}
      </p>
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
  );
}