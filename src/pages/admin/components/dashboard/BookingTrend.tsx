import React from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

interface BookingTrendProps {
  bookingTrend: {
    date: string;
    count: number;
  }[];
}

export function BookingTrend({ bookingTrend }: BookingTrendProps) {
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

  const bookingTrendData = {
    labels: bookingTrend.map(item => format(parseISO(item.date), 'MMM dd')),
    datasets: [
      {
        label: 'Bookings',
        data: bookingTrend.map(item => item.count),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
        borderWidth: 3,
      },
    ],
  };

  const bookingTrendOptions = {
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
        displayColors: false,
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
        },
        grid: {
          display: false,
        },
      },
    },
    animation: {
      duration: 2000,
    },
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  return (
    <motion.div 
      className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
      variants={cardVariants}
    >
      <h3 className="text-lg font-medium text-gray-800 mb-1">Booking Trend</h3>
      <p className="text-sm text-gray-500 mb-4">Last 7 Days</p>
      <div className="h-64">
        <Line 
          data={bookingTrendData} 
          options={bookingTrendOptions}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Total in Period</p>
          <p className="text-xl font-bold text-blue-600">
            {bookingTrend.reduce((sum, item) => sum + item.count, 0)}
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Daily Average</p>
          <p className="text-xl font-bold text-green-600">
            {(bookingTrend.reduce((sum, item) => sum + item.count, 0) / bookingTrend.length).toFixed(1)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}