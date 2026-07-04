import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { SALON_INFO } from '../utils/constants';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // TODO: wire up Supabase auth (supabase.auth.signInWithPassword)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      toast.error('Login no disponible: falta conectar el backend.');
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
        <h2 className="auth-title">Iniciar sesión</h2>
        <p className="auth-subtitle">Accedé a tu cuenta para gestionar tus citas</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-with-icon">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowPass(!showPass)}
                aria-label="Mostrar contraseña"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? <span className="spinner-sm" /> : <LogIn size={18} />}
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tenés cuenta?{' '}
          <Link to="/registro">Registrate acá</Link>
        </p>
        <p className="auth-footer">
          <Link to="/">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
