import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import { toReadableDate, to12h, formatPrice } from '../../utils/dates';
import { Calendar, Clock, Scissors, MessageCircle } from 'lucide-react';
import { buildConfirmationMessage, openWhatsApp } from '../../utils/whatsapp';
import { SALON_INFO } from '../../utils/constants';

// TODO: fetch client appointments from Supabase
const MyAppointments = () => {
  const { profile } = useAuth();
  const [appointments] = useState([]);
  const [loading] = useState(false);

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

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Mis citas</h1>
        <p>Historial completo de tus reservas</p>
      </div>

      {appointments.length === 0 ? (
        <div className="empty-state">
          <span className="empty-emoji">📅</span>
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
