import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, Shield, Heart, Clock } from 'lucide-react';
import { SALON_INFO } from '../utils/constants';
import { getActiveServices } from '../api/services';
import { getServiceIcon } from '../utils/serviceIcon';
import { formatPrice, formatDuration } from '../utils/dates';

const Landing = () => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    getActiveServices().then(setServices);
  }, []);

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>Nail Studio Profesional</span>
          </div>
          <h1 className="hero-title">
            Uñas que
            <span className="gradient-text"> brillan</span>
            {' '}tanto como vos
          </h1>
          <p className="hero-subtitle">
            Reservá tu turno online, elegí tu diseño y dejanos hacer la magia. 
            Calidad, higiene y arte en cada uña.
          </p>
          <div className="hero-cta">
            <Link to="/registro" className="btn btn-primary btn-lg">
              Reservar mi turno 💅
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-blob" />
          <div className="hero-emoji-float">💅</div>
          <div className="hero-emoji-float hero-emoji-2">✨</div>
          <div className="hero-emoji-float hero-emoji-3">🌸</div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="section-header">
          <h2>¿Por qué elegirnos?</h2>
          <p>Todo diseñado para que tu experiencia sea perfecta</p>
        </div>
        <div className="features-grid">
          {[
            { icon: Calendar, title: 'Reservas 24/7', desc: 'Agendá tu turno cuando quieras, sin llamadas ni esperas.' },
            { icon: Shield, title: 'Pago seguro', desc: 'Pago con Mercado Pago o transferencia. Tu seña asegura el turno.' },
            { icon: Heart, title: 'Diseños únicos', desc: 'Subí tus referencias de Pinterest o Instagram y creamos tu diseño ideal.' },
            { icon: Clock, title: 'Recordatorios', desc: 'Te avisamos por WhatsApp 24h antes para que no olvides tu cita.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon"><Icon size={24} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="services-section">
        <div className="section-header">
          <h2>Nuestros servicios</h2>
          <p>Precios y duración estimada. Los diseños se definen en persona o con tus fotos de referencia.</p>
        </div>
        <div className="services-grid">
          {services.map((service) => {
            const Icon = getServiceIcon(service.name);
            return (
              <div key={service.id} className="service-card">
                {service.imageUrl ? (
                  <img src={service.imageUrl} alt="" className="service-card-thumb" />
                ) : (
                  <div className="service-emoji"><Icon size={24} /></div>
                )}
                <div className="service-info">
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  <div className="service-meta">
                    <span className="service-duration"><Clock size={14} /> {formatDuration(service.duration)}</span>
                    <span className="service-price">{formatPrice(service.price)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="services-cta">
          <Link to="/registro" className="btn btn-primary btn-lg">Quiero reservar ahora</Link>
        </div>
      </section>

      {/* Policy */}
      <section className="policy-section">
        <div className="policy-card">
          <h2>📋 Políticas del salón</h2>
          <ul>
            <li>⏰ Cancelaciones con al menos <strong>24 horas de anticipación</strong></li>
            <li>🕐 Tolerancia de espera: <strong>máximo 15 minutos</strong></li>
            <li>💰 El anticipo pagado <strong>no es reembolsable</strong> ante inasistencia o cancelación tardía</li>
            <li>📱 Confirmación y recordatorio por <strong>WhatsApp</strong></li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <Sparkles size={20} />
        <span>{SALON_INFO.name} — Hecho con 💕</span>
      </footer>
    </div>
  );
};

export default Landing;
