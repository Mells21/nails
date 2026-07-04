import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import { toReadableDate, to12h, formatPrice } from '../../utils/dates';
import { Calendar, Users, DollarSign, ClipboardList, Scissors } from 'lucide-react';

// TODO: fetch appointments/clients from Supabase
const Dashboard = () => {
  const [appointments] = useState([]);
  const [clients] = useState([]);
  const [loading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter((a) => a.date === today);
  const pendingValidation = appointments.filter((a) => a.status === 'pending_validation');
  const confirmedApts = appointments.filter((a) => a.status === 'confirmed');
  const monthIncome = appointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + (a.servicePrice || 0), 0);

  const stats = [
    { icon: Calendar, label: 'Citas hoy', value: todayApts.length, color: '#f472b6', link: '/admin/citas' },
    { icon: ClipboardList, label: 'Por validar', value: pendingValidation.length, color: '#f59e0b', link: '/admin/citas' },
    { icon: Users, label: 'Clientas totales', value: clients.length, color: '#818cf8', link: '/admin/clientes' },
    { icon: DollarSign, label: 'Ingresos del mes', value: formatPrice(monthIncome), color: '#10b981', link: '/admin/citas' },
  ];

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <h1>¡Buenos días! 💅</h1>
        <p>Resumen del salón</p>
      </div>

      <div className="stats-grid">
        {stats.map(({ icon: Icon, label, value, color, link }) => (
          <Link key={label} to={link} className="stat-card" style={{ '--stat-color': color }}>
            <div className="stat-icon"><Icon size={22} /></div>
            <div className="stat-info">
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Today's appointments */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2><Scissors size={20} /> Citas de hoy</h2>
          <Link to="/admin/citas" className="btn btn-outline btn-sm">Ver todas</Link>
        </div>
        {todayApts.length === 0 ? (
          <div className="empty-state-sm">
            <p>No hay citas programadas para hoy.</p>
          </div>
        ) : (
          <div className="appointments-list">
            {todayApts.map((apt) => (
              <Link key={apt.id} to={`/admin/citas/${apt.id}`} className="appointment-card hoverable">
                <div className="apt-header">
                  <Badge status={apt.status} />
                  <span className="apt-time">{to12h(apt.time)}</span>
                </div>
                <div className="apt-body">
                  <strong>{apt.clientName}</strong>
                  <span>{apt.serviceName}</span>
                  <span>{formatPrice(apt.servicePrice)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pending validation */}
      {pendingValidation.length > 0 && (
        <div className="dashboard-section pending-alert">
          <div className="section-header">
            <h2>⚠️ Comprobantes pendientes de validación</h2>
          </div>
          <div className="appointments-list">
            {pendingValidation.map((apt) => (
              <Link key={apt.id} to={`/admin/citas/${apt.id}`} className="appointment-card hoverable">
                <Badge status={apt.status} />
                <strong>{apt.clientName}</strong> — {apt.serviceName} — {toReadableDate(apt.date)} {to12h(apt.time)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
