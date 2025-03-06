import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { PulseLoader } from 'react-spinners';
import { Clock, UserCheck, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  gender: string;
  age: number;
  case_id: string;
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
  current_appointment?: {
    id: string;
    status: 'waiting' | 'in_progress' | 'completed';
    started_at: string | null;
    completed_at: string | null;
  };
}

export default function ReceptionistPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayAppointments();

    // Subscribe to changes
    const subscription = supabase
      .channel('appointments_channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'appointments' 
      }, () => {
        fetchTodayAppointments();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'current_appointments'
      }, () => {
        fetchTodayAppointments();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          current_appointment:current_appointments(
            id,
            status,
            started_at,
            completed_at
          )
        `)
        .eq('appointment_date', today)
        .eq('status', 'scheduled')
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (appointment: Appointment, action: 'start' | 'complete') => {
    setActionInProgress(appointment.id);
    try {
      if (action === 'start') {
        // Check if there's already an in-progress appointment
        const { data: currentInProgress } = await supabase
          .from('current_appointments')
          .select('*')
          .eq('status', 'in_progress')
          .single();

        if (currentInProgress) {
          throw new Error('Another appointment is already in progress');
        }

        // Create new current appointment entry
        const { error } = await supabase
          .from('current_appointments')
          .insert({
            appointment_id: appointment.id,
            status: 'in_progress',
            started_at: new Date().toISOString()
          });

        if (error) throw error;
      } else {
        // Complete the current appointment
        const { error } = await supabase
          .from('current_appointments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('appointment_id', appointment.id);

        if (error) throw error;
      }

      await fetchTodayAppointments();
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      setError(error.message);
    } finally {
      setActionInProgress(null);
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
      <div className="flex justify-center items-center h-64">
        <PulseLoader color="#3B82F6" />
      </div>
    );
  }

  const currentAppointment = appointments.find(apt => apt.current_appointment?.status === 'in_progress');
  const waitingAppointments = appointments.filter(apt => !apt.current_appointment);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Today's Appointments</h2>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <span className="text-gray-600">{format(new Date(), 'MMMM d, yyyy')}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current/In Progress Section */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Current Appointment
          </h3>
          
          {currentAppointment ? (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{currentAppointment.name}</h4>
                  <p className="text-sm text-gray-600">Case ID: {currentAppointment.case_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    In Progress
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium">{formatTimeSlot(currentAppointment.appointment_time)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Started At</p>
                  <p className="font-medium">
                    {currentAppointment.current_appointment?.started_at
                      ? format(new Date(currentAppointment.current_appointment.started_at), 'hh:mm a')
                      : 'N/A'}
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => handleStatusChange(currentAppointment, 'complete')}
                isLoading={actionInProgress === currentAppointment.id}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                Complete Appointment
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No appointment in progress</p>
            </div>
          )}
        </div>

        {/* Waiting List Section */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Waiting List
          </h3>
          
          <div className="space-y-4">
            {waitingAppointments.map(appointment => (
              <div
                key={appointment.id}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-200 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{appointment.name}</h4>
                    <p className="text-sm text-gray-600">Case ID: {appointment.case_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatTimeSlot(appointment.appointment_time)}
                    </p>
                    <p className="text-xs text-gray-500">Scheduled Time</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium capitalize">{appointment.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-medium">{appointment.age} years</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => handleStatusChange(appointment, 'start')}
                  isLoading={actionInProgress === appointment.id}
                  disabled={!!currentAppointment}
                  className="w-full"
                >
                  Start Appointment
                </Button>
              </div>
            ))}
            
            {waitingAppointments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No patients waiting</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completed Appointments */}
      <div className="bg-green-50 p-6 rounded-xl border border-green-100">
        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Completed Today
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments
            .filter(apt => apt.current_appointment?.status === 'completed')
            .map(appointment => (
              <div
                key={appointment.id}
                className="bg-white p-4 rounded-lg shadow-sm border border-green-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{appointment.name}</h4>
                    <p className="text-sm text-gray-600">Case ID: {appointment.case_id}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Completed
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium">{formatTimeSlot(appointment.appointment_time)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed At</p>
                    <p className="font-medium">
                      {appointment.current_appointment?.completed_at
                        ? format(new Date(appointment.current_appointment.completed_at), 'hh:mm a')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
          {appointments.filter(apt => apt.current_appointment?.status === 'completed').length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No completed appointments yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}