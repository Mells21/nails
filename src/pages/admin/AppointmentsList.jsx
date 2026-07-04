import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllAppointments } from '../../api/appointments';
import Badge from '../../components/ui/Badge';
import { toReadableDate, to12h, formatPrice } from '../../utils/dates';
import { Search } from 'lucide-react';
import { APPOINTMENT_STATUSES } from '../../utils/constants';

const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllAppointments().then((data) => {
      setAppointments(data);
      setFiltered(data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = appointments;
    if (statusFilter) result = result.filter((a) => a.status === statusFilter);
    if (search) result = result.filter((a) =>
      a.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      a.serviceName?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, statusFilter, appointments]);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Citas</h1>
        <p>{appointments.length} citas en total</p>
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
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {Object.entries(APPOINTMENT_STATUSES).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="appointments-list">
        {filtered.map((apt) => (
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
    </div>
  );
};

export default AppointmentsList;
