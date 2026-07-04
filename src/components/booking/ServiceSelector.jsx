import { SERVICES } from '../../utils/constants';
import { formatPrice, formatDuration } from '../../utils/dates';
import { Clock, Check } from 'lucide-react';

const ServiceSelector = ({ selected, onChange }) => {
  return (
    <div className="service-selector">
      <h3 className="step-title">Elegí tu servicio</h3>
      <div className="service-selector-grid">
        {SERVICES.map((service) => (
          <button
            key={service.id}
            type="button"
            className={`service-option ${selected?.id === service.id ? 'selected' : ''}`}
            onClick={() => onChange(service)}
            style={{ '--service-color': service.color }}
          >
            <div className="service-option-top">
              <span className="service-option-emoji">{service.emoji}</span>
              {selected?.id === service.id && (
                <span className="service-check"><Check size={14} /></span>
              )}
            </div>
            <div className="service-option-body">
              <h4>{service.name}</h4>
              <p>{service.description}</p>
              <div className="service-option-meta">
                <span><Clock size={12} /> {formatDuration(service.duration)}</span>
                <span className="service-option-price">{formatPrice(service.price)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ServiceSelector;
