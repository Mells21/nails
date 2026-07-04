import { formatPrice, formatDuration, toReadableDate, to12h } from '../../utils/dates';
import { Calendar, Clock, Scissors, MapPin, Image } from 'lucide-react';
import { SALON_INFO } from '../../utils/constants';

const BookingSummary = ({ service, date, time, clientName, referenceFiles = [] }) => {
  return (
    <div className="booking-summary">
      <h3 className="step-title">Resumen de tu cita</h3>
      <div className="summary-card">
        <div className="summary-row">
          <span className="summary-label"><Scissors size={16} /> Servicio</span>
          <span className="summary-value">{service?.name}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label"><Calendar size={16} /> Fecha</span>
          <span className="summary-value">{date ? toReadableDate(date) : '—'}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label"><Clock size={16} /> Hora</span>
          <span className="summary-value">{time ? to12h(time) : '—'}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label"><Clock size={16} /> Duración</span>
          <span className="summary-value">{service ? formatDuration(service.duration) : '—'}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label"><MapPin size={16} /> Dirección</span>
          <span className="summary-value">{SALON_INFO.address}</span>
        </div>
        {referenceFiles.length > 0 && (
          <div className="summary-row">
            <span className="summary-label"><Image size={16} /> Referencias</span>
            <span className="summary-value">{referenceFiles.length} foto(s) subida(s)</span>
          </div>
        )}
        <div className="summary-divider" />
        <div className="summary-row summary-total">
          <span className="summary-label">Total a pagar</span>
          <span className="summary-price">{service ? formatPrice(service.price) : '—'}</span>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;
