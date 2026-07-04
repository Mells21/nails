import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllAppointments } from '../../api/appointments';
import Badge from '../../components/ui/Badge';
import { toReadableDate, to12h, formatPrice } from '../../utils/dates';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { APPOINTMENT_STATUSES } from '../../utils/constants';
import { AppointmentCardSkeleton } from '../../components/ui/CardSkeletons';
import Skeleton from '../../components/ui/Skeleton';

const PER_PAGE = 8;

const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllAppointments().then((data) => {
      setAppointments(data);
      setFiltered(data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let result = appointments;
    if (statusFilter) result = result.filter((a) => a.status === statusFilter);
    if (debouncedSearch) result = result.filter((a) =>
      a.clientName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      a.serviceName?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    setFiltered(result);
    setPage(1);
  }, [debouncedSearch, statusFilter, appointments]);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="page-header">
          <h1>Citas</h1>
          <Skeleton className="skeleton-text" style={{ width: 100 }} />
        </div>
        <div className="appointments-list">
          {Array.from({ length: 5 }).map((_, i) => <AppointmentCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Citas</h1>
        <p>{appointments.length} citas en total</p>
      </div>

      <div className="status-chips">
        <button
          className={`status-chip ${statusFilter === '' ? 'active' : ''}`}
          onClick={() => setStatusFilter('')}
        >
          Todas
        </button>
        {Object.entries(APPOINTMENT_STATUSES).map(([key, { label, color, bg }]) => (
          <button
            key={key}
            className={`status-chip ${statusFilter === key ? 'active' : ''}`}
            style={statusFilter === key ? { background: bg, color, borderColor: color } : undefined}
            onClick={() => setStatusFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por clienta o servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="appointments-list">
        {paginated.map((apt) => (
          <Link key={apt.id} to={`/admin/citas/${apt.id}`} className="appointment-card hoverable">
            <div className="apt-header">
              <Badge status={apt.status} />
              <span className="apt-date">{toReadableDate(apt.date)} · {to12h(apt.time)}</span>
            </div>
            <div className="apt-body">
              <strong>{apt.clientName}</strong>
              <span>{apt.serviceName}</span>
              <span className="apt-price">{formatPrice(apt.servicePrice)}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state-sm"><p>No hay citas que coincidan.</p></div>
        )}
      </div>

      {filtered.length > PER_PAGE && (
        <div className="pagination">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <span className="pagination-label">Página {page} de {totalPages}</span>
          <button
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

export default AppointmentsList;
