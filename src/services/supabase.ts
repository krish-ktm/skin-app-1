import { createClient } from '@supabase/supabase-js';
import type { Appointment } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const appointmentService = {
  async getAppointmentsByCaseId(caseId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('case_id', caseId.toUpperCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  },

  async getAppointmentsByDate(date: string) {
    try {
      // Get appointments for the date
      const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('appointment_date', date);

      if (aptError) throw aptError;
      return appointments || [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>) {
    // Check current booking count for the time slot
    const { data: existingBookings, error: countError } = await supabase
      .from('appointments')
      .select('id')
      .eq('appointment_date', appointment.appointment_date)
      .eq('appointment_time', appointment.appointment_time);

    if (countError) throw countError;
    if (existingBookings && existingBookings.length >= 4) {
      throw new Error('This time slot is now full. Please select another time.');
    }

    const { error } = await supabase
      .from('appointments')
      .insert(appointment);

    if (error) throw error;
  },

  async getTotalBookings() {
    const { count, error } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },

  async getTodayBookings(today: string) {
    const { count, error } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', today);

    if (error) throw error;
    return count || 0;
  },

  async getUpcomingBookings(today: string) {
    const { count, error } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('appointment_date', today);

    if (error) throw error;
    return count || 0;
  }
};