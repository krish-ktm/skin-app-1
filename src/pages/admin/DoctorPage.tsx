import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { PulseLoader } from 'react-spinners';
import { Clock, UserCheck, AlertCircle, Calendar, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface CurrentAppointment {
  id: string;
  appointment: {
    id: string;
    name: string;
    phone: string;
    appointment_date: string;
    appointment_time: string;
    gender: string;
    age: number;
    case_id: string;
  };
  status: 'waiting' | 'in_progress' | 'completed';
  started_at: string | null;
}

export default function DoctorPage() {
  const [currentAppointment, setCurrentAppointment] = useState<CurrentAppointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentAppointment();

    // Subscribe to changes
    const subscription = supabase
      .channel('current_appointment_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'current_appointments'
      }, () => {
        fetchCurrentAppointment();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchCurrentAppointment = async () => {
    try {
      const { data, error } = await supabase
        .from('current_appointments')
        .select(`
          id,
          status,
          started_at,
          appointment:appointments (
            id,
            name,
            phone,
            appointment_date,
            appointment_time,
            gender,
            age,
            case_id
          )
        `)
        .eq('status', 'in_progress')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No appointment found
          setCurrentAppointment(null);
        } else {
          throw error;
        }
      } else {
        setCurrentAppointment(data);
      }
    } catch (error: any) {
      console.error('Error fetching current appointment:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeSlot = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <PulseLoader color="#3B82F6" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {error && (
        <div className="max-w-3xl mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {currentAppointment ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-blue-500 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold">{currentAppointment.appointment.name}</h1>
                  <p className="text-blue-100">Case ID: {currentAppointment.appointment.case_id}</p>
                </div>
                <div className="text-right">
                  <div className="bg-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                    In Progress
                  </div>
                  <p className="text-blue-100 text-sm mt-1">
                    Started at {format(new Date(currentAppointment.started_at!), 'hh:mm a')}
                  </p>
                </div>
              </div>
            </div>

            {/* Patient Details */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500 block">Gender</label>
                    <p className="text-lg font-medium capitalize">
                      {currentAppointment.appointment.gender}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 block">Age</label>
                    <p className="text-lg font-medium">
                      {currentAppointment.appointment.age} years
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500 block">Appointment Time</label>
                    <p className="text-lg font-medium">
                      {formatTimeSlot(currentAppointment.appointment.appointment_time)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 block">Phone</label>
                    <p className="text-lg font-medium">
                      {currentAppointment.appointment.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="border-t border-gray-100 p-6 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Appointment Timeline</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">Scheduled</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(currentAppointment.appointment.appointment_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">Started</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(currentAppointment.started_at!), 'hh:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Active Appointment</h2>
            <p className="text-gray-600">
              Waiting for the receptionist to start the next appointment
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}