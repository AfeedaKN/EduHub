/**
 * Date formatting and manipulation utilities for EduHub Frontend
 */

/**
 * Formats a Date object, ISO string, or timestamp into human-readable format: "Oct 19, 2026"
 */
export function formatDate(
  input: string | Date | number | null | undefined,
  fallback: string = 'N/A'
): string {
  if (!input) return fallback;
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats date into standard YYYY-MM-DD format for HTML date input controls
 */
export function toInputDateString(
  input: string | Date | number | null | undefined
): string {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

/**
 * Formats time string (HH:mm) into 12-hour format with AM/PM: "09:30 AM"
 */
export function formatTime12Hour(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24 || '';
  const [hourStr, minuteStr] = time24.trim().split(':');
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || '00';

  if (isNaN(hour)) return time24;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour === 0 ? 12 : hour;

  return `${String(hour).padStart(2, '0')}:${minute.padStart(2, '0')} ${ampm}`;
}

/**
 * Checks if a date is today
 */
export function isToday(input: string | Date): boolean {
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return false;

  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Checks if a date is in the past compared to today
 */
export function isPastDate(input: string | Date): boolean {
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return false;

  const todayZero = new Date();
  todayZero.setHours(0, 0, 0, 0);

  const targetZero = new Date(date);
  targetZero.setHours(0, 0, 0, 0);

  return targetZero < todayZero;
}
