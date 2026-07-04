/**
 * Get available time slots for a specific date, excluding booked slots.
 * Pure function — no backend dependency.
 * @param {Object} dayConfig - { enabled, start, end, breaks: [{ breakStart, breakEnd }] }
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

    const inBreak = breaks.some(({ breakStart, breakEnd }) => {
      const [bsh, bsm] = breakStart.split(':').map(Number);
      const [beh, bem] = breakEnd.split(':').map(Number);
      const breakStartMin = bsh * 60 + bsm;
      const breakEndMin = beh * 60 + bem;
      return current < breakEndMin && current + serviceDurationMinutes > breakStartMin;
    });

    const isBooked = bookedSlots.some((b) => b.time === timeStr);

    if (!inBreak && !isBooked) {
      slots.push(timeStr);
    }

    current += 30;
  }

  return slots;
};
