export interface Booking {
  id: string;
  case_id: string;
  name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  created_at: string;
  gender: string;
}

export type SortField = 'case_id' | 'name' | 'phone' | 'appointment_date' | 'appointment_time';
export type SortOrder = 'asc' | 'desc';

export interface Filter {
  field: string;
  value: string;
}

export interface DateRange {
  start: string;
  end: string;
}