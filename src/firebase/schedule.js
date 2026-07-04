import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { format } from 'date-fns';

const COLLECTION = 'schedule';

/**
 * Get the schedule for a specific week (identified by the Monday date string)
 * Schedule document ID = "YYYY-MM-DD" of that week's Monday
 */
export const getWeekSchedule = async (mondayDateStr) => {
  const snap = await getDoc(doc(db, COLLECTION, mondayDateStr));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  return null;
};

/**
 * Save or update a week's schedule
 * @param {string} mondayDateStr - "YYYY-MM-DD"
 * @param {Object} days - { "2025-01-06": { enabled: true, start: "09:00", end: "18:00", breaks: [] }, ... }
 */
export const saveWeekSchedule = async (mondayDateStr, days) => {
  await setDoc(
    doc(db, COLLECTION, mondayDateStr),
    {
      weekStart: mondayDateStr,
      days,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
};

/**
 * Get all enabled weeks (for public calendar display)
 */
export const getAvailableWeeks = async () => {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Get available time slots for a specific date, excluding booked slots
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {number} serviceDurationMinutes
 * @param {Array} bookedSlots - array of { time: "HH:mm" } objects already booked
 */
export const getAvailableSlots = (dayConfig, serviceDurationMinutes, bookedSlots = []) => {
  if (!dayConfig || !dayConfig.enabled) return [];

  const { start, end, breaks = [] } = dayConfig;
  const slots = [];

  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  let current = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (current + serviceDurationMinutes <= endMinutes) {
    const slotHour = Math.floor(current / 60);
    const slotMin = current % 60;
    const timeStr = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;

    // Check if slot overlaps with any break
    const inBreak = breaks.some(({ breakStart, breakEnd }) => {
      const [bsh, bsm] = breakStart.split(':').map(Number);
      const [beh, bem] = breakEnd.split(':').map(Number);
      const breakStartMin = bsh * 60 + bsm;
      const breakEndMin = beh * 60 + bem;
      return current < breakEndMin && current + serviceDurationMinutes > breakStartMin;
    });

    // Check if slot is already booked
    const isBooked = bookedSlots.some((b) => b.time === timeStr);

    if (!inBreak && !isBooked) {
      slots.push(timeStr);
    }

    current += 30; // 30-minute increments
  }

  return slots;
};
