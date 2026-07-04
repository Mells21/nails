import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerClient } from '../firebase/auth';
import { Sparkles, Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { SALON_INFO } from '../utils/constants';

const Register = () => {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await registerClient(form);
      toast.success('¡Cuenta creada! Ya podés reservar tu cita 💅');
      navigate('/reservar');
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Ese correo ya está registrado.',
        'auth/weak-password': 'La contraseña es muy débil.',
      };
      toast.error(msgs[err.code] || 'Error al registrarse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Sparkles size={32} />
          <h1>{SALON_INFO.name}</h1>
        </div>
        <h2 className="auth-title">Crear cuenta</h2>
        <p className="auth-subtitle">Registrate para reservar y gestionar tus citas</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reg-name">Nombre completo</label>
            <input id="reg-name" name="name" type="text" value={form.name} onChange={handleChange} placeholder="Tu nombre" required />
          </div>
          <div className="form-group">
            <label htmlFor="reg-phone">WhatsApp (con código de país)</label>
            <input id="reg-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+57300000000" required />
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">Correo electrónico</label>
            <input id="reg-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="tu@correo.com" required />
          </div>
          <div className="form-group">
            <label htmlFor="reg-pass">Contraseña</label>
            <div className="input-with-icon">
              <input id="reg-pass" name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" required />
              <button type="button" className="icon-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="reg-confirm">Confirmar contraseña</label>
            <input id="reg-confirm" name="confirm" type="password" value={form.confirm} onChange={handleChange} placeholder="Repetí tu contraseña" required />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner-sm" /> : <UserPlus size={18} />}
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
        <p className="auth-footer">
          <Link to="/">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
