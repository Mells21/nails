import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../firebase/auth';
import { Sparkles, LogOut, Calendar, User, LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';
import { SALON_INFO } from '../../utils/constants';

const Navbar = () => {
  const { user, isAdmin, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Sesión cerrada');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="brand-link">
          <Sparkles size={22} className="brand-icon" />
          <span>{SALON_INFO.name}</span>
        </Link>
      </div>

      <div className="navbar-menu">
        {!user && (
          <>
            <Link to="/" className="nav-link">Inicio</Link>
            <Link to="/login" className="btn btn-outline btn-sm">Iniciar sesión</Link>
            <Link to="/registro" className="btn btn-primary btn-sm">Registrarse</Link>
          </>
        )}

        {user && isAdmin && (
          <>
            <Link to="/admin" className="nav-link">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link to="/admin/calendario" className="nav-link">
              <Calendar size={16} /> Agenda
            </Link>
            <Link to="/admin/clientes" className="nav-link">
              <User size={16} /> Clientes
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
              <LogOut size={16} /> Salir
            </button>
          </>
        )}

        {user && !isAdmin && (
          <>
            <Link to="/reservar" className="nav-link">
              <Calendar size={16} /> Reservar
            </Link>
            <Link to="/mis-citas" className="nav-link">
              Mis citas
            </Link>
            <Link to="/perfil" className="nav-link">
              <User size={16} /> {profile?.name?.split(' ')[0] || 'Perfil'}
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
              <LogOut size={16} /> Salir
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
