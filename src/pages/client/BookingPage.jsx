import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAvailableSlots } from '../../utils/slots';
import { getEnabledDays } from '../../api/schedule';
import { createAppointment, getBookedSlots } from '../../api/appointments';
import { uploadReferencePhoto } from '../../api/storage';
import ServiceSelector from '../../components/booking/ServiceSelector';
import ReferenceUpload from '../../components/booking/ReferenceUpload';
import BookingSummary from '../../components/booking/BookingSummary';
import ManualPayment from '../../components/payment/ManualPayment';
import { buildAdminNotificationMessage } from '../../utils/whatsapp';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from '../../utils/toast';

const STEPS = ['Servicio', 'Fecha y hora', 'Fotos', 'Pago'];

const BookingPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [referenceFiles, setReferenceFiles] = useState([]);
  const [enabledSchedule, setEnabledSchedule] = useState({});
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [bookedSlots, setBookedSlots] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getEnabledDays().then(setEnabledSchedule).finally(() => setLoadingSchedule(false));
  }, []);

  const handleDateSelect = async (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setLoadingSlots(true);
    try {
      const booked = await getBookedSlots(dateStr);
      setBookedSlots((prev) => ({ ...prev, [dateStr]: booked }));
    } finally {
      setLoadingSlots(false);
    }
  };

  const getAvailableSlotsForDate = (dateStr) => {
    if (!selectedService) return [];
    return getAvailableSlots(enabledSchedule[dateStr], selectedService.duration, bookedSlots[dateStr] || []);
  };

  const handleCreateAppointment = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error('Completá todos los campos.');
      return false;
    }
    setSubmitting(true);
    try {
      const id = crypto.randomUUID();

      const referencePhotoPaths = await Promise.all(
        referenceFiles.map((file, i) => uploadReferencePhoto(file, user.id, id, i))
      );

      await createAppointment({
        id,
        clientId: user.id,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceDuration: selectedService.duration,
        date: selectedDate,
        time: selectedTime,
        referencePhotos: referencePhotoPaths,
      });

      setAppointmentId(id);
      toast.success('¡Cita creada! Ahora completá el pago.');
      return true;
    } catch (err) {
      if (err.code === '23505') {
        toast.error('Justo se ocupó ese horario. Elegí otro, por favor.');
        setSelectedTime(null);
        const booked = await getBookedSlots(selectedDate);
        setBookedSlots((prev) => ({ ...prev, [selectedDate]: booked }));
        setStep(1);
      } else {
        toast.error(err.message || 'Error al crear la cita.');
      }
      return false;
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
      const created = await handleCreateAppointment();
      if (!created) return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const enabledDays = Object.keys(enabledSchedule);

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

              {loadingSchedule ? (
                <div className="spinner" />
              ) : (
                <div className="dates-grid">
                  {enabledDays.map((dateStr) => (
                    <button
                      key={dateStr}
                      type="button"
                      className={`date-btn ${selectedDate === dateStr ? 'selected' : ''}`}
                      onClick={() => handleDateSelect(dateStr)}
                    >
                      {new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PE', {
                        weekday: 'short', day: 'numeric', month: 'short',
                      })}
                    </button>
                  ))}
                  {enabledDays.length === 0 && (
                    <p className="no-slots">No hay fechas disponibles todavía.</p>
                  )}
                </div>
              )}

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
              adminNotificationMessage={buildAdminNotificationMessage({
                clientName: profile?.name,
                clientPhone: profile?.phone,
                date: selectedDate,
                time: selectedTime,
                service: selectedService?.name,
                price: selectedService?.price,
              })}
              onSuccess={() => {
                toast.success('¡Comprobante enviado! La dueña confirmará tu cita pronto.');
              }}
              onDone={() => navigate('/mis-citas')}
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
