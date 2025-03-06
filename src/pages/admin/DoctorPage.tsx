import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Clock, Calendar, User, Phone, CheckCircle2 } from 'lucide-react';
import { PulseLoader } from 'react-spinners';
import { Button } from '../../components/ui/Button';

interface Appointment {
  id: string;
  case_id: string;
  name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  gender: string;
  age: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  is_current: boolean;
}

export default function DoctorPage() {
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCurrentAppointment();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('appointments_channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments' 
        }, 
        () => {
          fetchCurrentAppointment();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchCurrentAppointment = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', today)
        .eq('is_current', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentAppointment(data || null);
    } catch (error) {
      console.error('Error fetching current appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!currentAppointment) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'completed',
          is_current: false
        })
        .eq('id', currentAppointment.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error completing appointment:', error);
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
      <div className="flex justify-center items-center h-screen">
        <PulseLoader color="#3B82F6" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">Doctor's Dashboard</h2>

        {currentAppointment ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Current Patient</h3>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-400 text-white">
                  In Progress
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-500">
                    <User className="h-5 w-5" />
                    <p className="text-sm">Patient Name</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{currentAppointment.name}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-5 w-5" />
                    <p className="text-sm">Case ID</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{currentAppointment.case_id}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="h-5 w-5" />
                    <p className="text-sm">Appointment Time</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatTimeSlot(currentAppointment.appointment_time)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="h-5 w-5" />
                    <p className="text-sm">Contact</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{currentAppointment.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Gender</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{currentAppointment.gender}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Age</p>
                  <p className="text-lg font-semibold text-gray-900">{currentAppointment.age} years</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleComplete}
                  className="bg-green-500 hover:bg-green-600"
                  icon={<CheckCircle2 className="h-5 w-5" />}
                >
                  Mark as Completed
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-2xl shadow-md text-center"
          >
            <div className="max-w-md mx-auto">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Active Appointment</h3>
              <p className="text-gray-500">
                Waiting for the receptionist to assign the next patient.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}