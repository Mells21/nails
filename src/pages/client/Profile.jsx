import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateOwnProfile } from '../../api/profiles';
import { User, Phone, Mail, Heart, AlertTriangle, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    favoriteColors: profile?.favoriteColors || '',
    allergies: profile?.allergies || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateOwnProfile(user.id, form);
      toast.success('Perfil actualizado ✅');
    } catch (err) {
      toast.error(err.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Mi perfil</h1>
        <p>Tus datos personales y preferencias</p>
      </div>

      <form onSubmit={handleSave} className="profile-form">
        <div className="profile-section">
          <h2><User size={18} /> Datos personales</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="prof-name">Nombre completo</label>
              <input id="prof-name" name="name" value={form.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="prof-phone"><Phone size={14} /> WhatsApp</label>
              <input id="prof-phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+57300000000" />
            </div>
          </div>
          <div className="form-group">
            <label><Mail size={14} /> Correo (no editable)</label>
            <input value={profile?.email || ''} disabled />
          </div>
        </div>

        <div className="profile-section">
          <h2><Heart size={18} /> Preferencias de uñas</h2>
          <div className="form-group">
            <label htmlFor="prof-colors">Colores favoritos</label>
            <input id="prof-colors" name="favoriteColors" value={form.favoriteColors} onChange={handleChange} placeholder="Ej: nude, rosado palo, rojo vino..." />
          </div>
          <div className="form-group">
            <label htmlFor="prof-allergies"><AlertTriangle size={14} /> Alergias o sensibilidades</label>
            <input id="prof-allergies" name="allergies" value={form.allergies} onChange={handleChange} placeholder="Ej: acrílico, ninguna..." />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <span className="spinner-sm" /> : <Save size={18} />}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
