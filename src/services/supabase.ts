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
    // First check if the day is disabled
    const { data: daySettings } = await supabase
      .from('time_slot_settings')
      .select('is_disabled')
      .eq('date', date)
      .is('time', null);

    // If there's a day-level setting and it's disabled, return empty array
    if (daySettings && daySettings.length > 0 && daySettings[0].is_disabled) {
      return [];
    }

    // Get disabled time slots
    const { data: slotSettings, error: slotError } = await supabase
      .from('time_slot_settings')
      .select('time')
      .eq('date', date)
      .eq('is_disabled', true)
      .not('time', 'is', null);

    if (slotError) throw slotError;
    const disabledTimes = new Set(slotSettings?.map(s => s.time) || []);

    // Get appointments for available slots
    const { data: appointments, error: aptError } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', date);

    if (aptError) throw aptError;

    // Filter out appointments for disabled slots
    return appointments?.filter(apt => !disabledTimes.has(apt.appointment_time)) || [];
  },

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>) {
    // Check if the day or time slot is disabled
    const { data: settings, error: settingsError } = await supabase
      .from('time_slot_settings')
      .select('*')
      .eq('date', appointment.appointment_date)
      .or(`time.is.null,time.eq.${appointment.appointment_time}`);

    if (settingsError) throw settingsError;

    const isDayOrSlotDisabled = settings?.some(s => s.is_disabled);
    if (isDayOrSlotDisabled) {
      throw new Error('This time slot is not available for booking');
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