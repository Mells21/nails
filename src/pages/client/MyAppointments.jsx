import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getClientAppointments } from '../../api/appointments';
import { getAdminPhone } from '../../api/profiles';
import Badge from '../../components/ui/Badge';
import { toReadableDate, to12h, formatPrice } from '../../utils/dates';
import { Calendar, Clock, Scissors, MessageCircle, AlertCircle } from 'lucide-react';
import { buildConfirmationMessage, buildAdminNotificationMessage, openWhatsApp } from '../../utils/whatsapp';
import { SALON_INFO } from '../../utils/constants';

const NEEDS_ADMIN_NOTICE = ['pending_payment', 'pending_validation'];

const MyAppointments = () => {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminPhone, setAdminPhone] = useState(null);

  useEffect(() => {
    if (!user) return;
    getClientAppointments(user.id)
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    getAdminPhone().then(setAdminPhone).catch(() => setAdminPhone(null));
  }, []);

  const contactPhone = adminPhone || SALON_INFO.whatsapp;

  const handleWhatsApp = (apt) => {
    const msg = buildConfirmationMessage({
      clientName: profile.name,
      date: apt.date,
      time: apt.time,
      service: apt.serviceName,
      address: SALON_INFO.address,
    });
    openWhatsApp(SALON_INFO.whatsapp, msg);
  };

  const handleNotifyAdmin = (apt) => {
    const msg = buildAdminNotificationMessage({
      clientName: profile?.name,
      clientPhone: profile?.phone,
      date: apt.date,
      time: apt.time,
      service: apt.serviceName,
      price: apt.servicePrice,
    });
    openWhatsApp(contactPhone, msg);
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Mis citas</h1>
        <p>Historial completo de tus reservas</p>
      </div>

      {appointments.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} className="empty-emoji" />
          <h3>No tenés citas todavía</h3>
          <p>¡Reservá tu primer turno!</p>
          <a href="/reservar" className="btn btn-primary">Reservar ahora</a>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map((apt) => (
            <div key={apt.id} className="appointment-card">
              <div className="apt-header">
                <Badge status={apt.status} />
                <span className="apt-date">
                  <Calendar size={14} /> {toReadableDate(apt.date)}
                </span>
              </div>
              <div className="apt-body">
                <div className="apt-detail">
                  <Clock size={14} /> {to12h(apt.time)}
                </div>
                <div className="apt-detail">
                  <Scissors size={14} /> {apt.serviceName}
                </div>
                <div className="apt-price">{formatPrice(apt.servicePrice)}</div>
              </div>
              {NEEDS_ADMIN_NOTICE.includes(apt.status) && (
                <div className="apt-notice">
                  <p><AlertCircle size={14} /> Recordá avisarle a la dueña para que valide tu cita más rápido.</p>
                  <button
                    className="btn btn-whatsapp btn-sm apt-wa-btn"
                    onClick={() => handleNotifyAdmin(apt)}
                  >
                    <MessageCircle size={14} /> Avisar a la dueña por WhatsApp
                  </button>
                </div>
              )}
              {apt.status === 'confirmed' && (
                <button
                  className="btn btn-outline btn-sm apt-wa-btn"
                  onClick={() => handleWhatsApp(apt)}
                >
                  <MessageCircle size={14} /> Ver confirmación WA
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
