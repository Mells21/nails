import { useState, useEffect } from 'react';
import { getWeekSchedule, saveWeekSchedule } from '../../firebase/schedule';
import { getMondayOf, toDateStr, getWeekDays } from '../../utils/dates';
import { addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_DAY = { enabled: false, start: '09:00', end: '18:00', breaks: [] };

const CalendarManager = () => {
  const [currentMonday, setCurrentMonday] = useState(getMondayOf(new Date()));
  const [schedule, setSchedule] = useState({});
  const [saving, setSaving] = useState(false);

  const mondayStr = toDateStr(currentMonday);
  const weekDays = getWeekDays(mondayStr);

  useEffect(() => {
    getWeekSchedule(mondayStr).then((data) => {
      setSchedule(data?.days || {});
    });
  }, [mondayStr]);

  const toggleDay = (dateStr) => {
    setSchedule((prev) => ({
      ...prev,
      [dateStr]: { ...DEFAULT_DAY, ...prev[dateStr], enabled: !prev[dateStr]?.enabled },
    }));
  };

  const updateDayField = (dateStr, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [dateStr]: { ...DEFAULT_DAY, ...prev[dateStr], [field]: value },
    }));
  };

  const addBreak = (dateStr) => {
    const day = schedule[dateStr] || { ...DEFAULT_DAY };
    const breaks = [...(day.breaks || []), { breakStart: '12:00', breakEnd: '13:00' }];
    updateDayField(dateStr, 'breaks', breaks);
  };

  const removeBreak = (dateStr, bi) => {
    const day = schedule[dateStr] || { ...DEFAULT_DAY };
    const breaks = day.breaks.filter((_, i) => i !== bi);
    updateDayField(dateStr, 'breaks', breaks);
  };

  const updateBreak = (dateStr, bi, field, value) => {
    const day = schedule[dateStr] || { ...DEFAULT_DAY };
    const breaks = day.breaks.map((b, i) => i === bi ? { ...b, [field]: value } : b);
    updateDayField(dateStr, 'breaks', breaks);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveWeekSchedule(mondayStr, schedule);
      toast.success('Agenda guardada ✅');
    } catch {
      toast.error('Error al guardar la agenda.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Mi Agenda</h1>
        <p>Activá los días y horarios disponibles para esta semana</p>
      </div>

      <div className="week-nav">
        <button className="btn btn-ghost" onClick={() => setCurrentMonday(subWeeks(currentMonday, 1))}>
          <ChevronLeft size={18} /> Semana anterior
        </button>
        <span className="week-label">{mondayStr}</span>
        <button className="btn btn-ghost" onClick={() => setCurrentMonday(addWeeks(currentMonday, 1))}>
          Siguiente semana <ChevronRight size={18} />
        </button>
      </div>

      <div className="calendar-editor">
        {weekDays.map(({ dateStr, label }) => {
          const day = schedule[dateStr] || { ...DEFAULT_DAY };
          return (
            <div key={dateStr} className={`day-editor ${day.enabled ? 'day-active' : ''}`}>
              <div className="day-header">
                <label className="day-toggle">
                  <input
                    type="checkbox"
                    checked={!!day.enabled}
                    onChange={() => toggleDay(dateStr)}
                  />
                  <span className="toggle-slider" />
                </label>
                <span className="day-label">{label}</span>
              </div>

              {day.enabled && (
                <div className="day-config">
                  <div className="time-range">
                    <div className="form-group">
                      <label>Desde</label>
                      <input
                        type="time"
                        value={day.start}
                        onChange={(e) => updateDayField(dateStr, 'start', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Hasta</label>
                      <input
                        type="time"
                        value={day.end}
                        onChange={(e) => updateDayField(dateStr, 'end', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="breaks-section">
                    <div className="breaks-header">
                      <span>Bloqueos / Descansos</span>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => addBreak(dateStr)}>
                        <Plus size={14} /> Agregar
                      </button>
                    </div>
                    {(day.breaks || []).map((br, bi) => (
                      <div key={bi} className="break-row">
                        <input
                          type="time"
                          value={br.breakStart}
                          onChange={(e) => updateBreak(dateStr, bi, 'breakStart', e.target.value)}
                        />
                        <span>a</span>
                        <input
                          type="time"
                          value={br.breakEnd}
                          onChange={(e) => updateBreak(dateStr, bi, 'breakEnd', e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => removeBreak(dateStr, bi)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="save-row">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner-sm" /> : <Save size={18} />}
          {saving ? 'Guardando...' : 'Guardar semana'}
        </button>
      </div>
    </div>
  );
};

export default CalendarManager;
