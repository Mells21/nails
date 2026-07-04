import { useEffect, useState } from 'react';
import { getActiveServices } from '../../api/services';
import { getServiceIcon } from '../../utils/serviceIcon';
import { formatPrice, formatDuration } from '../../utils/dates';
import { Clock, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { ServiceOptionSkeleton } from '../ui/CardSkeletons';

const PER_PAGE = 6;

const ServiceSelector = ({ selected, onChange }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    getActiveServices()
      .then(setServices)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  if (loading) {
    return (
      <div className="service-selector">
        <h3 className="step-title">Elegí tu servicio</h3>
        <div className="service-selector-grid">
          {Array.from({ length: 6 }).map((_, i) => <ServiceOptionSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const filtered = debouncedSearch
    ? services.filter((s) =>
        s.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : services;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="service-selector">
      <h3 className="step-title">Elegí tu servicio</h3>

      <div className="search-box service-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Buscar servicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="service-selector-grid">
        {paginated.map((service) => {
          const Icon = getServiceIcon(service.name);
          return (
            <button
              key={service.id}
              type="button"
              className={`service-option ${selected?.id === service.id ? 'selected' : ''}`}
              onClick={() => onChange(service)}
              style={{ '--service-color': service.color }}
            >
              <div className="service-option-media">
                {service.imageUrl ? (
                  <img src={service.imageUrl} alt="" />
                ) : (
                  <div className="service-option-media-empty"><Icon size={28} /></div>
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
        {filtered.length === 0 && <p className="no-slots">No hay servicios que coincidan.</p>}
      </div>

      {filtered.length > PER_PAGE && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <span className="pagination-label">Página {page} de {totalPages}</span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ServiceSelector;
