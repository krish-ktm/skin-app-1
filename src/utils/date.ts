export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getDaysInMonth(date: Date): (number | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const days: (number | null)[] = [];
  
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  return days;
}

export function isDateDisabled(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const maxDate = new Date();
  maxDate.setHours(0, 0, 0, 0);
  maxDate.setDate(today.getDate() + 3);
  
  return date < today || date > maxDate;
}

export function toUTCDateString(date: Date): string {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
    .toISOString()
    .split('T')[0];
}

export function isTimeSlotExpired(time: string, date: Date): boolean {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const slotDate = new Date(date);
  slotDate.setHours(hours, minutes, 0, 0);
  
  // Convert both dates to IST for comparison
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const nowIST = new Date(now.getTime() + istOffset);
  const slotIST = new Date(slotDate.getTime() + istOffset);
  
  return nowIST >= slotIST;
}

export function formatTimeSlot(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}