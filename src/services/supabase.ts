import { createClient } from '@supabase/supabase-js';
import type { Appointment } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true
  },
  global: {
    headers: {
      'X-Client-Info': 'appointment-system'
    }
  }
});

export const appointmentService = {
  async getAppointmentsByCaseId(caseId: string) {
    // First check if any appointments exist with this case ID
    const { data, error, count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('case_id', caseId.toUpperCase())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    
    // If no appointments found, throw an error
    if (!data || data.length === 0) {
      throw new Error('No appointment found with this Case ID');
    }
    
    // Return the most recent appointment
    return data[0];
  },

  async getAppointmentsByDate(date: string) {
    try {
      // Get appointments for the date
      const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('appointment_date', date);

      if (aptError) throw aptError;

      // Get disabled slots for the date
      const { data: disabledSlots, error: disabledError } = await supabase
        .from('time_slot_settings')
        .select('time, is_disabled')
        .eq('date', date)
        .eq('is_disabled', true);

      if (disabledError) throw disabledError;

      // Check if the entire day is disabled
      const isDayDisabled = disabledSlots?.some(slot => slot.time === null);
      
      if (isDayDisabled) {
        throw new Error('This day is not available for bookings');
      }

      return {
        appointments: appointments || [],
        disabledSlots: disabledSlots || []
      };
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>) {
    // Check if the slot or day is disabled
    const { data: disabledSlots, error: disabledError } = await supabase
      .from('time_slot_settings')
      .select('time')
      .eq('date', appointment.appointment_date)
      .eq('is_disabled', true);

    if (disabledError) throw disabledError;

    const isDayOrSlotDisabled = disabledSlots?.some(
      slot => slot.time === null || slot.time === appointment.appointment_time
    );

    if (isDayOrSlotDisabled) {
      throw new Error('This time slot is not available for booking');
    }

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