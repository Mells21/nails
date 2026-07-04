import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../../api/auth';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { toast } from '../../utils/toast';
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
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success('Sesión cerrada');
    navigate('/');
  };

  return (
    <>
      <header className="admin-mobile-header">
        <button
          className="admin-mobile-toggle"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
        <img src="/images/marca.webp" alt="" className="sidebar-brand-icon" />
        <span className="sidebar-brand-name">{SALON_INFO.name}</span>
      </header>

      {mobileOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/images/marca.webp" alt="" className="sidebar-brand-icon" />
          <div>
            <span className="sidebar-brand-name">{SALON_INFO.name}</span>
            <span className="sidebar-brand-role">Panel Admin</span>
          </div>
          <button
            className="admin-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
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
    </>
  );
};

export default AdminSidebar;
