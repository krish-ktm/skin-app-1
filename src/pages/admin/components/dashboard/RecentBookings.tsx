import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface RecentBookingsProps {
  recentBookings: any[];
}

export function RecentBookings({ recentBookings }: RecentBookingsProps) {
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

  return (
    <motion.div 
      className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
      variants={cardVariants}
    >
      <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Bookings</h3>
      {recentBookings.length > 0 ? (
        <div className="overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {recentBookings.map((booking) => (
              <li key={booking.id} className="py-3 hover:bg-gray-50 rounded-lg px-2 transition-colors duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{booking.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.appointment_date).toLocaleDateString()} at {formatTimeSlot(booking.appointment_time)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    booking.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                  }`}>
                    {booking.gender}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <Calendar className="h-12 w-12 mb-2 text-gray-400" />
          <p>No recent bookings</p>
        </div>
      )}
    </motion.div>
  );
}