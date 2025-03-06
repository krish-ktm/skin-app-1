import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Clock, Calendar, User, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { PulseLoader } from 'react-spinners';
import { Button } from '../../components/ui/Button';
import { format } from 'date-fns';

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

export default function ReceptionistPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    fetchAppointments();

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
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      setAppointments(data || []);
      const current = data?.find(apt => apt.is_current);
      setCurrentAppointment(current || null);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      showNotification('Failed to fetch appointments', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSetCurrent = async (appointment: Appointment) => {
    try {
      // First, remove current flag from all appointments
      const { error: resetError } = await supabase
        .from('appointments')
        .update({ is_current: false })
        .eq('appointment_date', appointment.appointment_date);

      if (resetError) throw resetError;

      // Set the selected appointment as current
      const { error } = await supabase
        .from('appointments')
        .update({ 
          is_current: true,
          status: 'in_progress'
        })
        .eq('id', appointment.id);

      if (error) throw error;

      showNotification('Current appointment updated successfully', 'success');
      fetchAppointments();
    } catch (error) {
      console.error('Error setting current appointment:', error);
      showNotification('Failed to update current appointment', 'error');
    }
  };

  const handleStatusChange = async (appointment: Appointment, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status,
          is_current: status === 'completed' || status === 'cancelled' ? false : appointment.is_current
        })
        .eq('id', appointment.id);

      if (error) throw error;

      showNotification('Appointment status updated successfully', 'success');
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      showNotification('Failed to update appointment status', 'error');
    }
  };

  const formatTimeSlot = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <PulseLoader color="#3B82F6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Receptionist Dashboard</h2>
        
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <p className={`text-sm ${
                notification.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {notification.message}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {currentAppointment && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-blue-900">Current Appointment</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentAppointment.status)}`}>
              {currentAppointment.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-blue-700">Patient Name</p>
              <p className="font-medium text-gray-900">{currentAppointment.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-blue-700">Case ID</p>
              <p className="font-medium text-gray-900">{currentAppointment.case_id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-blue-700">Time</p>
              <p className="font-medium text-gray-900">{formatTimeSlot(currentAppointment.appointment_time)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-blue-700">Status</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={currentAppointment.status === 'completed' ? 'primary' : 'outline'}
                  onClick={() => handleStatusChange(currentAppointment, 'completed')}
                  className={currentAppointment.status === 'completed' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant={currentAppointment.status === 'cancelled' ? 'primary' : 'outline'}
                  onClick={() => handleStatusChange(currentAppointment, 'cancelled')}
                  className={currentAppointment.status === 'cancelled' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Today's Appointments</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {appointments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No appointments scheduled for today
            </div>
          ) : (
            appointments.map((appointment) => (
              <div 
                key={appointment.id} 
                className={`p-6 ${
                  appointment.is_current ? 'bg-blue-50' : 'hover:bg-gray-50'
                } transition-colors duration-150`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Name
                      </p>
                      <p className="font-medium text-gray-900">{appointment.name}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Phone
                      </p>
                      <p className="font-medium text-gray-900">{appointment.phone}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Time
                      </p>
                      <p className="font-medium text-gray-900">
                        {formatTimeSlot(appointment.appointment_time)}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Status
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        getStatusColor(appointment.status)
                      }`}>
                        {appointment.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!appointment.is_current && appointment.status === 'scheduled' && (
                      <Button
                        onClick={() => handleSetCurrent(appointment)}
                        className="whitespace-nowrap"
                      >
                        Set as Current
                      </Button>
                    )}
                    {appointment.status === 'scheduled' && (
                      <Button
                        variant="outline"
                        onClick={() => handleStatusChange(appointment, 'cancelled')}
                        className="text-red-600 hover:text-red-700"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}