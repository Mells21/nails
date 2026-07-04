import { supabase } from '../lib/supabase';

const toHM = (time) => time?.slice(0, 5) || null;

const mapDay = (row) => ({
  enabled: row.enabled,
  start: toHM(row.start_time) || '09:00',
  end: toHM(row.end_time) || '18:00',
  breaks: (row.schedule_breaks || []).map((b) => ({
    breakStart: toHM(b.break_start),
    breakEnd: toHM(b.break_end),
  })),
});

/**
 * Trae la configuración de agenda para un conjunto de fechas ("YYYY-MM-DD"[]).
 * Devuelve { [dateStr]: { enabled, start, end, breaks } }. Las fechas sin
 * fila en schedule_days simplemente no aparecen en el resultado (= no
 * configuradas todavía, se tratan como deshabilitadas).
 */
export const getScheduleForDates = async (dateStrs) => {
  const { data, error } = await supabase
    .from('schedule_days')
    .select('*, schedule_breaks(*)')
    .in('date', dateStrs);
  if (error) throw error;

  const map = {};
  data.forEach((row) => { map[row.date] = mapDay(row); });
  return map;
};

/**
 * Trae todos los días habilitados desde hoy en adelante (uso público:
 * BookingPage). Devuelve { [dateStr]: { enabled, start, end, breaks } }.
 */
export const getEnabledDays = async () => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('schedule_days')
    .select('*, schedule_breaks(*)')
    .eq('enabled', true)
    .gte('date', today)
    .order('date', { ascending: true });
  if (error) throw error;

  const map = {};
  data.forEach((row) => { map[row.date] = mapDay(row); });
  return map;
};

/**
 * Guarda la configuración de una semana (o cualquier conjunto de días).
 * @param {Object} days - { [dateStr]: { enabled, start, end, breaks } }
 */
export const saveSchedule = async (days) => {
  for (const [date, config] of Object.entries(days)) {
    const { data: dayRow, error: upsertError } = await supabase
      .from('schedule_days')
      .upsert(
        {
          date,
          enabled: config.enabled,
          start_time: config.enabled ? config.start : null,
          end_time: config.enabled ? config.end : null,
        },
        { onConflict: 'date' }
      )
      .select()
      .single();
    if (upsertError) throw upsertError;

    const { error: deleteError } = await supabase
      .from('schedule_breaks')
      .delete()
      .eq('schedule_day_id', dayRow.id);
    if (deleteError) throw deleteError;

    if (config.enabled && config.breaks?.length > 0) {
      const { error: insertError } = await supabase
        .from('schedule_breaks')
        .insert(config.breaks.map((b) => ({
          schedule_day_id: dayRow.id,
          break_start: b.breakStart,
          break_end: b.breakEnd,
        })));
      if (insertError) throw insertError;
    }
  }
};
