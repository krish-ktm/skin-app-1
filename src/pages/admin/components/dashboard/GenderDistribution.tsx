import React from 'react';
import { motion } from 'framer-motion';
import { Doughnut } from 'react-chartjs-2';

interface GenderDistributionProps {
  genderDistribution: {
    male: number;
    female: number;
  };
}

export function GenderDistribution({ genderDistribution }: GenderDistributionProps) {
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

  return (
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
  );
}