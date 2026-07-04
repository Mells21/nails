import { useEffect, useState } from 'react';
import { getActiveServices } from '../../api/services';
import { getServiceIcon } from '../../utils/serviceIcon';
import { formatPrice, formatDuration } from '../../utils/dates';
import { Clock, Check } from 'lucide-react';

const ServiceSelector = ({ selected, onChange }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveServices()
      .then(setServices)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="service-selector">
      <h3 className="step-title">Elegí tu servicio</h3>
      <div className="service-selector-grid">
        {services.map((service) => {
          const Icon = getServiceIcon(service.name);
          return (
            <button
              key={service.id}
              type="button"
              className={`service-option ${selected?.id === service.id ? 'selected' : ''}`}
              onClick={() => onChange(service)}
              style={{ '--service-color': service.color }}
            >
              <div className="service-option-top">
                {service.imageUrl ? (
                  <img src={service.imageUrl} alt="" className="service-option-thumb" />
                ) : (
                  <Icon size={22} className="service-option-icon" />
                )}
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
          );
        })}
        {services.length === 0 && <p className="no-slots">No hay servicios disponibles todavía.</p>}
      </div>
    </div>
  );
};

export default ServiceSelector;
