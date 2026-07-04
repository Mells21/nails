import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAvailableSlots } from '../../utils/slots';
import ServiceSelector from '../../components/booking/ServiceSelector';
import ReferenceUpload from '../../components/booking/ReferenceUpload';
import BookingSummary from '../../components/booking/BookingSummary';
import ManualPayment from '../../components/payment/ManualPayment';
import { toDateStr, getWeekDays } from '../../utils/dates';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = ['Servicio', 'Fecha y hora', 'Fotos', 'Pago'];

// TODO: fetch available weeks/booked slots and create appointment via Supabase
const BookingPage = () => {
  const { profile } = useAuth();

  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [referenceFiles, setReferenceFiles] = useState([]);
  const [weeks] = useState([]);
  const [bookedSlots, setBookedSlots] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [appointmentCreated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setLoadingSlots(true);
    setBookedSlots((prev) => ({ ...prev, [dateStr]: [] }));
    setLoadingSlots(false);
  };

  const getAvailableSlotsForDate = (dateStr) => {
    if (!selectedService || !weeks.length) return [];
    const week = weeks.find((w) => {
      const days = getWeekDays(w.weekStart);
      return days.some((d) => d.dateStr === dateStr);
    });
    if (!week) return [];
    const dayConfig = week.days?.[dateStr];
    return getAvailableSlots(dayConfig, selectedService.duration, bookedSlots[dateStr] || []);
  };

  const handleCreateAppointment = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error('Completá todos los campos.');
      return;
    }
    setSubmitting(true);
    try {
      toast.error('Creación de cita no disponible: falta conectar el backend.');
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!selectedService;
    if (step === 1) return !!selectedDate && !!selectedTime;
    return true;
  };

  const handleNext = async () => {
    if (step === 2) {
      await handleCreateAppointment();
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  // Gather all enabled dates from weeks
  const enabledDays = weeks.flatMap((w) => {
    const days = getWeekDays(w.weekStart);
    return days.filter((d) => w.days?.[d.dateStr]?.enabled).map((d) => d.dateStr);
  });

  return (
    <div className="booking-page">
      <div className="booking-container">
        {/* Stepper */}
        <div className="stepper">
          {STEPS.map((label, i) => (
            <div key={label} className={`step-item ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="step-dot">{i < step ? '✓' : i + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="booking-content">
          {step === 0 && (
            <ServiceSelector selected={selectedService} onChange={setSelectedService} />
          )}

          {step === 1 && (
            <div className="date-time-step">
              <h3 className="step-title">Elegí fecha y hora</h3>
              {!selectedService && <p>Seleccioná un servicio primero.</p>}

              <div className="dates-grid">
                {enabledDays.map((dateStr) => (
                  <button
                    key={dateStr}
                    type="button"
                    className={`date-btn ${selectedDate === dateStr ? 'selected' : ''}`}
                    onClick={() => handleDateSelect(dateStr)}
                  >
                    {new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO', {
                      weekday: 'short', day: 'numeric', month: 'short',
                    })}
                  </button>
                ))}
              </div>

              {selectedDate && (
                <div className="time-slots">
                  <h4>Horarios disponibles</h4>
                  {loadingSlots ? (
                    <div className="spinner" />
                  ) : (
                    <div className="slots-grid">
                      {getAvailableSlotsForDate(selectedDate).map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`slot-btn ${selectedTime === slot ? 'selected' : ''}`}
                          onClick={() => setSelectedTime(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                      {getAvailableSlotsForDate(selectedDate).length === 0 && (
                        <p className="no-slots">No hay horarios disponibles para este día.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <ReferenceUpload files={referenceFiles} onChange={setReferenceFiles} />
              <BookingSummary
                service={selectedService}
                date={selectedDate}
                time={selectedTime}
                clientName={profile?.name}
                referenceFiles={referenceFiles}
              />
            </div>
          )}

          {step === 3 && appointmentCreated && (
            <ManualPayment amount={selectedService?.price} />
          )}
        </div>

        {/* Navigation */}
        {step < 3 && (
          <div className="booking-nav">
            {step > 0 && (
              <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
                <ChevronLeft size={18} /> Atrás
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!canNext() || submitting}
            >
              {submitting ? <span className="spinner-sm" /> : null}
              {step === 2 ? 'Confirmar y pagar' : 'Continuar'}
              {step < 2 && <ChevronRight size={18} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
