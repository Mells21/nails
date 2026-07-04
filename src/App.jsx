import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import AdminSidebar from './components/layout/AdminSidebar';
import { useAuth } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Client pages
import BookingPage from './pages/client/BookingPage';
import MyAppointments from './pages/client/MyAppointments';
import Profile from './pages/client/Profile';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import CalendarManager from './pages/admin/CalendarManager';
import AppointmentsList from './pages/admin/AppointmentsList';
import AppointmentDetail from './pages/admin/AppointmentDetail';
import ClientsCRM from './pages/admin/ClientsCRM';
import ServiceManager from './pages/admin/ServiceManager';

// Admin layout wrapper
const AdminLayout = ({ children }) => (
  <div className="admin-layout">
    <AdminSidebar />
    <main className="admin-main">{children}</main>
  </div>
);

// Client layout wrapper
const ClientLayout = ({ children }) => (
  <div className="client-layout">
    <Navbar />
    <main className="client-main">{children}</main>
  </div>
);

const AppRoutes = () => {
  const { isAdmin } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<ClientLayout><Landing /></ClientLayout>} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />

      {/* Client routes */}
      <Route path="/reservar" element={
        <ProtectedRoute role="client">
          <ClientLayout><BookingPage /></ClientLayout>
        </ProtectedRoute>
      } />
      <Route path="/mis-citas" element={
        <ProtectedRoute role="client">
          <ClientLayout><MyAppointments /></ClientLayout>
        </ProtectedRoute>
      } />
      <Route path="/perfil" element={
        <ProtectedRoute role="client">
          <ClientLayout><Profile /></ClientLayout>
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <AdminLayout><Dashboard /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/calendario" element={
        <ProtectedRoute role="admin">
          <AdminLayout><CalendarManager /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/citas" element={
        <ProtectedRoute role="admin">
          <AdminLayout><AppointmentsList /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/citas/:id" element={
        <ProtectedRoute role="admin">
          <AdminLayout><AppointmentDetail /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/clientes" element={
        <ProtectedRoute role="admin">
          <AdminLayout><ClientsCRM /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/servicios" element={
        <ProtectedRoute role="admin">
          <AdminLayout><ServiceManager /></AdminLayout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
