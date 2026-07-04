import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { SALON_INFO } from '../../utils/constants';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/calendario', icon: Calendar, label: 'Mi Agenda' },
  { to: '/admin/citas', icon: ClipboardList, label: 'Citas' },
  { to: '/admin/clientes', icon: Users, label: 'Clientes' },
  { to: '/admin/servicios', icon: Settings, label: 'Servicios' },
];

const AdminSidebar = () => {
  const navigate = useNavigate();

  // TODO: wire up Supabase auth (supabase.auth.signOut)
  const handleLogout = () => {
    navigate('/');
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <Sparkles size={24} />
        <div>
          <span className="sidebar-brand-name">{SALON_INFO.name}</span>
          <span className="sidebar-brand-role">Panel Admin</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button onClick={handleLogout} className="sidebar-logout">
        <LogOut size={18} />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  );
};

export default AdminSidebar;
