import { useState } from 'react';
import { SERVICES } from '../../utils/constants';
import { formatPrice, formatDuration } from '../../utils/dates';
import { Clock, DollarSign, Info } from 'lucide-react';

const ServiceManager = () => {
  const [services] = useState(SERVICES);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Servicios</h1>
        <p>Menú de servicios del salón</p>
      </div>

      <div className="info-banner">
        <Info size={16} />
        <span>Para editar los precios y duraciones, modificá el archivo <code>src/utils/constants.js</code>.</span>
      </div>

      <div className="services-admin-grid">
        {services.map((service) => (
          <div key={service.id} className="service-admin-card">
            <div className="service-admin-header">
              <span className="service-admin-emoji">{service.emoji}</span>
              <h3>{service.name}</h3>
            </div>
            <p className="service-admin-desc">{service.description}</p>
            <div className="service-admin-meta">
              <span><Clock size={14} /> {formatDuration(service.duration)}</span>
              <span><DollarSign size={14} /> {formatPrice(service.price)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceManager;
