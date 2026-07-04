import { format, addDays, startOfWeek, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Get Monday (start of week) for a given date
 */
export const getMondayOf = (date) => startOfWeek(date, { weekStartsOn: 1 });

/**
 * Format date to "YYYY-MM-DD"
 */
export const toDateStr = (date) => format(date, 'yyyy-MM-dd');

/**
 * Format date to human readable Spanish
 */
export const toReadableDate = (dateStr) =>
  format(parseISO(dateStr), "EEEE d 'de' MMMM", { locale: es });

/**
 * Format time to 12h format
 */
export const to12h = (time24) => {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'p.m.' : 'a.m.';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

/**
 * Format price to Colombian pesos
 */
export const formatPrice = (amount) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

/**
 * Format duration in minutes to readable string
 */
export const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

/**
 * Get the 7 days of a week starting from Monday date string
 */
export const getWeekDays = (mondayDateStr) => {
  const monday = parseISO(mondayDateStr);
  return Array.from({ length: 7 }, (_, i) => ({
    dateStr: toDateStr(addDays(monday, i)),
    label: format(addDays(monday, i), 'EEEE d MMM', { locale: es }),
    dayIndex: (i + 1) % 7, // 0=Sunday, 1=Monday...
  }));
};

/**
 * Check if a date is in the past
 */
export const isPast = (dateStr) => parseISO(dateStr) < new Date();
