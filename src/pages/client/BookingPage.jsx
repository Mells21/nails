import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAvailableWeeks, getAvailableSlots } from '../../firebase/schedule';
import { getAppointmentsByDateRange } from '../../firebase/appointments';
import { createAppointment } from '../../firebase/appointments';
import { uploadReferencePhoto } from '../../firebase/storage';
import ServiceSelector from '../../components/booking/ServiceSelector';
import ReferenceUpload from '../../components/booking/ReferenceUpload';
import BookingSummary from '../../components/booking/BookingSummary';
import ManualPayment from '../../components/payment/ManualPayment';
import { toDateStr, getWeekDays } from '../../utils/dates';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = ['Servicio', 'Fecha y hora', 'Fotos', 'Pago'];

const BookingPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [referenceFiles, setReferenceFiles] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [bookedSlots, setBookedSlots] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAvailableWeeks().then(setWeeks);
  }, []);

  const handleDateSelect = async (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setLoadingSlots(true);
    try {
      const start = dateStr;
      const end = dateStr;
      const booked = await getAppointmentsByDateRange(start, end);
      const slots = booked
        .filter((a) => ['confirmed', 'pending_payment', 'pending_validation'].includes(a.status))
        .map((a) => ({ time: a.time }));
      setBookedSlots((prev) => ({ ...prev, [dateStr]: slots }));
    } finally {
      setLoadingSlots(false);
    }
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
      const id = await createAppointment({
        clientUid: user.uid,
        clientName: profile.name,
        clientPhone: profile.phone,
        clientEmail: profile.email,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceDuration: selectedService.duration,
        date: selectedDate,
        time: selectedTime,
        referencePhotos: [],
      });

      // Upload reference photos
      if (referenceFiles.length > 0) {
        const urls = await Promise.all(
          referenceFiles.map((f, i) => uploadReferencePhoto(f, id, i))
        );
        // Update with photo URLs (done via ManualPayment or after payment)
      }

      setAppointmentId(id);
      toast.success('¡Cita creada! Ahora completá el pago.');
    } catch (err) {
      console.error(err);
      toast.error('Error al crear la cita.');
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

          {step === 3 && appointmentId && (
            <ManualPayment
              appointmentId={appointmentId}
              amount={selectedService?.price}
              onSuccess={() => {
                toast.success('¡Comprobante enviado! La dueña confirmará tu cita pronto 🎉');
                navigate('/mis-citas');
              }}
            />
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
