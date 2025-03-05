// Calendar Constants
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Time Slots
const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 23, // 5 PM
};

export const TIME_ZONE = 'Asia/Kolkata'; // IST timezone

// Generate time slots from 9 AM to 5 PM with 30-minute intervals
export const INITIAL_TIME_SLOTS = (() => {
  const slots = [];
  for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
    // Add both :00 and :30 slots for each hour
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      available: true
    });
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:30`,
      available: true
    });
  }
  // Add the last slot at 5 PM
  slots.push({
    time: `${BUSINESS_HOURS.end.toString().padStart(2, '0')}:00`,
    available: true
  });
  return slots;
})();