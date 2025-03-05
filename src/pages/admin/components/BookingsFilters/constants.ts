import { formatTimeSlot } from '../../../../utils/date';
import { INITIAL_TIME_SLOTS } from '../../../../constants';

export const AGE_RANGES = [
  { label: 'All Ages', value: '' },
  { label: '0-18', value: '0-18' },
  { label: '19-30', value: '19-30' },
  { label: '31-45', value: '31-45' },
  { label: '46-60', value: '46-60' },
  { label: '61+', value: '61+' }
];

export const GENDER_OPTIONS = [
  { label: 'All Genders', value: '' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' }
];

export const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Missed', value: 'missed' },
  { label: 'Cancelled', value: 'cancelled' }
];

export const TIME_SLOTS = INITIAL_TIME_SLOTS.map(slot => ({
  label: formatTimeSlot(slot.time),
  value: slot.time
}));