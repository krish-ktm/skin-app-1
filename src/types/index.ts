// Appointment Types
export interface Appointment {
  id: string;
  case_id: string;
  name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  created_at: string;
  gender: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  bookingCount?: number;
}

export interface BookingStatus {
  success?: boolean;
  message?: string;
  appointment?: Appointment;
}

export interface FormData {
  name: string;
  phone: string;
  caseId: string;
}