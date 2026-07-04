import { useEffect, useState } from 'react';
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
  uploadServiceImage,
  removeServiceImage,
} from '../../api/services';
import { getServiceIcon } from '../../utils/serviceIcon';
import { formatPrice, formatDuration } from '../../utils/dates';
import Modal from '../../components/ui/Modal';
import { Clock, DollarSign, Plus, Pencil, Trash2, EyeOff, Eye, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', description: '', duration: 60, price: 0, color: '#f472b6' };
const MAX_SIZE_MB = 5;

const ServiceManager = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => getAllServices().then(setServices).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setModalOpen(true);
  };

  const openEdit = (service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price,
      color: service.color || '#f472b6',
    });
    setImageFile(null);
    setImagePreview(service.imageUrl || null);
    setExistingImageUrl(service.imageUrl || null);
    setModalOpen(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} no es una imagen.`);
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`${file.name} supera ${MAX_SIZE_MB}MB.`);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = async () => {
    if (imageFile) {
      // Todavía no se había subido: solo descartamos la selección local.
      setImageFile(null);
      setImagePreview(existingImageUrl);
      return;
    }
    if (!existingImageUrl || !editingId) return;
    try {
      await removeServiceImage(editingId);
      setImagePreview(null);
      setExistingImageUrl(null);
      toast.success('Imagen eliminada');
      load();
    } catch (err) {
      toast.error(err.message || 'Error al eliminar la imagen.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        duration: Number(form.duration),
        price: Number(form.price),
        color: form.color,
      };
      const service = editingId
        ? await updateService(editingId, payload)
        : await createService(payload);

      if (imageFile) {
        await uploadServiceImage(imageFile, service.id);
      }

      toast.success(editingId ? 'Servicio actualizado ✅' : 'Servicio creado ✅');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Error al guardar el servicio.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (service) => {
    try {
      await updateService(service.id, { active: !service.active });
      toast.success(service.active ? 'Servicio desactivado' : 'Servicio activado');
      load();
    } catch (err) {
      toast.error(err.message || 'Error al actualizar.');
    }
  };

  const handleDelete = async (service) => {
    if (!confirm(`¿Eliminar "${service.name}" definitivamente?`)) return;
    try {
      await deleteService(service.id);
      toast.success('Servicio eliminado');
      load();
    } catch (err) {
      toast.error(err.message || 'Error al eliminar.');
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="admin-page">
      <div className="page-header page-header-actions">
        <div>
          <h1>Servicios</h1>
          <p>Menú de servicios del salón</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Nuevo servicio
        </button>
      </div>

      <div className="services-admin-grid">
        {services.map((service) => {
          const Icon = getServiceIcon(service.name);
          return (
            <div key={service.id} className={`service-admin-card ${!service.active ? 'service-inactive' : ''}`}>
              <div className="service-admin-header">
                {service.imageUrl ? (
                  <img src={service.imageUrl} alt="" className="service-admin-thumb" />
                ) : (
                  <div className="service-admin-icon"><Icon size={20} /></div>
                )}
                <h3>{service.name}</h3>
              </div>
              <p className="service-admin-desc">{service.description}</p>
              <div className="service-admin-meta">
                <span><Clock size={14} /> {formatDuration(service.duration)}</span>
                <span><DollarSign size={14} /> {formatPrice(service.price)}</span>
              </div>
              <div className="service-admin-actions">
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(service)}>
                  <Pencil size={14} /> Editar
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(service)}>
                  {service.active ? <EyeOff size={14} /> : <Eye size={14} />}
                  {service.active ? 'Desactivar' : 'Activar'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(service)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {services.length === 0 && (
          <div className="empty-state-sm"><p>No hay servicios cargados todavía.</p></div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar servicio' : 'Nuevo servicio'}
      >
        <form onSubmit={handleSave} className="service-form">
          <div className="form-group">
            <label htmlFor="svc-name">Nombre</label>
            <input id="svc-name" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="svc-desc">Descripción</label>
            <textarea id="svc-desc" name="description" value={form.description} onChange={handleChange} rows={2} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="svc-duration">Duración (min)</label>
              <input id="svc-duration" name="duration" type="number" min="5" step="5" value={form.duration} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="svc-price">Precio (S/)</label>
              <input id="svc-price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="svc-color">Color de acento</label>
            <input id="svc-color" name="color" type="color" value={form.color} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Imagen del servicio</label>
            {imagePreview && (
              <div className="upload-preview">
                <img src={imagePreview} alt="Vista previa" />
                <button
                  type="button"
                  className="upload-remove"
                  onClick={handleRemoveImage}
                  aria-label="Quitar imagen"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <label className="upload-area" htmlFor="svc-image">
              <Upload size={24} />
              <span>{imagePreview ? 'Cambiar imagen' : 'Subir imagen'}</span>
              <input id="svc-image" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
            {saving ? <span className="spinner-sm" /> : null}
            {saving ? 'Guardando...' : 'Guardar servicio'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ServiceManager;
