import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Protects routes based on authentication and role.
 * @param {string} role - "admin" | "client" | null (any authenticated user)
 */
const ProtectedRoute = ({ children, role = null }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role && profile?.role !== role) {
    // Admin trying to access client area → goes to admin
    if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
    // Client trying to access admin → goes to booking
    return <Navigate to="/reservar" replace />;
  }

  return children;
};

export default ProtectedRoute;
