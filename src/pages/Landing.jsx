import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { Calendar, Shield, Heart, Clock, ClipboardList, Timer, Wallet, MessageCircle } from 'lucide-react';
import { SALON_INFO } from '../utils/constants';
import { getActiveServices } from '../api/services';
import { getServiceIcon } from '../utils/serviceIcon';
import { formatPrice, formatDuration } from '../utils/dates';

gsap.registerPlugin(ScrollTrigger, TextPlugin);

const GALLERY = [
  { src: '/images/img13.webp', tall: true },
  { src: '/images/img1.webp' },
  { src: '/images/img11.webp' },
  { src: '/images/img6.webp' },
  { src: '/images/iimg7.webp', tall: true },
  { src: '/images/img12.webp' },
  { src: '/images/img3.webp' },
  { src: '/images/img19.webp' },
  { src: '/images/img15.webp', tall: true },
];

const Landing = () => {
  const [services, setServices] = useState([]);
  const rootRef = useRef(null);
  const titleLine1Ref = useRef(null);
  const gradientRef = useRef(null);
  const titleLine2Ref = useRef(null);

  useEffect(() => {
    getActiveServices().then(setServices);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      const textTargets = [titleLine1Ref.current, gradientRef.current, titleLine2Ref.current];

      tl.set(textTargets, { text: '' })
        .from('.hero-badge, .hero-title, .hero-subtitle, .hero-cta', {
          opacity: 0,
          y: 24,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power2.out',
        })
        .from('.hero-visual img', {
          opacity: 0,
          scale: 0.95,
          duration: 0.9,
          ease: 'power2.out',
        }, '<')
        // El título se escribe solo, palabra por palabra
        .to(titleLine1Ref.current, { duration: 0.5, text: 'Uñas que', ease: 'none' }, '-=0.2')
        .to(gradientRef.current, { duration: 0.5, text: ' brillan', ease: 'none' })
        .to(titleLine2Ref.current, { duration: 0.6, text: ' tanto como vos', ease: 'none' })
        // y una vez escrito, "brillan" queda con un brillo en loop
        .to('.gradient-text', {
          backgroundPosition: '200% 0%',
          duration: 2.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

      // Parallax: en desktop bien marcado, en mobile mucho más sutil
      // porque las fotos son mucho más chicas y se notaba demasiado
      const isMobile = window.innerWidth <= 768;
      gsap.to('.hero-photo-main', {
        y: isMobile ? -90 : -280,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5,
        },
      });
      gsap.to('.hero-photo-accent', {
        y: isMobile ? -45 : -140,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5,
        },
      });

      // Encabezados de sección y la tarjeta de políticas: aparecen
      // a compás del scroll, no de golpe
      gsap.utils.toArray('.features .section-header, .gallery-section .section-header, .services-section .section-header, .policy-card').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 30,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',
            end: 'top 65%',
            scrub: 0.6,
          },
        });
      });

      // Cards de features y servicios: cada una aparece a su propio
      // ritmo a medida que se van revelando con el scroll
      gsap.utils.toArray('.feature-card, .service-card').forEach((card) => {
        gsap.from(card, {
          opacity: 0,
          y: 36,
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            start: 'top 95%',
            end: 'top 70%',
            scrub: 0.6,
          },
        });
      });

      // Galería: cada foto se revela a compás del scroll
      gsap.utils.toArray('.gallery-item').forEach((item) => {
        gsap.from(item, {
          opacity: 0,
          y: 30,
          ease: 'none',
          scrollTrigger: {
            trigger: item,
            start: 'top 95%',
            end: 'top 68%',
            scrub: 0.6,
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="landing" ref={rootRef}>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <img src="/images/marca.webp" alt="" style={{ height: 18, width: 18, objectFit: 'contain' }} />
            <span>Estudio de uñas en Rioja</span>
          </div>
          <h1 className="hero-title">
            <span ref={titleLine1Ref}>Uñas que</span>
            <span className="gradient-text" ref={gradientRef}> brillan</span>
            <span ref={titleLine2Ref}> tanto como vos</span>
          </h1>
          <p className="hero-subtitle">
            Reservá tu turno online, elegí tu diseño y dejanos hacer la magia.
            Calidad, higiene y arte en cada uña.
          </p>
          <div className="hero-cta">
            <Link to="/registro" className="btn btn-primary btn-lg">
              <Calendar size={18} /> Reservar mi turno
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <img src="/images/local-interior.webp" alt="Interior de AuraNails" className="hero-photo-main" />
          <img src="/images/local-mirror.webp" alt="Recepción de AuraNails" className="hero-photo-accent" />
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
            { icon: Shield, title: 'Pago seguro', desc: 'Transferencia con comprobante. Tu seña asegura el turno.' },
            { icon: Heart, title: 'Diseños únicos', desc: 'Subí tus referencias de Pinterest o Instagram y creamos tu diseño ideal.' },
            { icon: Clock, title: 'Recordatorios', desc: 'Te avisamos por WhatsApp para que no olvides tu cita.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon"><Icon size={24} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="gallery-section">
        <div className="section-header">
          <h2>Nuestros trabajos</h2>
          <p>Diseños reales, hechos en el estudio</p>
        </div>
        <div className="gallery-grid">
          {GALLERY.map(({ src, tall }) => (
            <div key={src} className={`gallery-item ${tall ? 'tall' : ''}`}>
              <img src={src} alt="Trabajo de nail art de AuraNails" loading="lazy" />
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
          <h2><ClipboardList size={20} /> Políticas del salón</h2>
          <ul>
            <li><Clock size={16} /> Cancelaciones con al menos <strong>24 horas de anticipación</strong></li>
            <li><Timer size={16} /> Tolerancia de espera: <strong>máximo 15 minutos</strong></li>
            <li><Wallet size={16} /> El anticipo pagado <strong>no es reembolsable</strong> ante inasistencia o cancelación tardía</li>
            <li><MessageCircle size={16} /> Confirmación y recordatorio por <strong>WhatsApp</strong></li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <img src="/images/marca.webp" alt={SALON_INFO.name} />
        <span>{SALON_INFO.name}, hecho con cariño</span>
      </footer>
    </div>
  );
};

export default Landing;
