import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { uploadPaymentProof } from '../../api/storage';
import { submitPaymentProof } from '../../api/appointments';
import { getAdminPhone } from '../../api/profiles';
import { openWhatsApp } from '../../utils/whatsapp';
import { Upload, CreditCard, CheckCircle, MessageCircle, Info } from 'lucide-react';
import { formatPrice } from '../../utils/dates';
import { SALON_INFO } from '../../utils/constants';
import { toast } from '../../utils/toast';

const MAX_SIZE_MB = 10;

const ManualPayment = ({ appointmentId, amount, adminNotificationMessage, onSuccess, onDone }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [adminPhone, setAdminPhone] = useState(null);

  useEffect(() => {
    getAdminPhone().then(setAdminPhone).catch(() => setAdminPhone(null));
  }, []);

  const contactPhone = adminPhone || SALON_INFO.whatsapp;

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error(`${f.name} no es una imagen.`);
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`${f.name} supera ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Subí el comprobante primero.');
      return;
    }
    setUploading(true);
    try {
      const path = await uploadPaymentProof(file, user.id, appointmentId);
      await submitPaymentProof(appointmentId, path);
      setDone(true);
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || 'Error al subir el comprobante.');
    } finally {
      setUploading(false);
    }
  };

  if (done) {
    return (
      <div className="payment-success">
        <CheckCircle size={48} className="success-icon" />
        <h3>¡Comprobante enviado!</h3>
        <p>La dueña revisará tu pago y confirmará la cita pronto.</p>
        {adminNotificationMessage && (
          <button
            className="btn btn-whatsapp"
            onClick={() => {
              openWhatsApp(contactPhone, adminNotificationMessage);
              onDone?.();
            }}
          >
            <MessageCircle size={18} /> Avisarle a la dueña por WhatsApp
          </button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={() => onDone?.()}>
          Ir a mis citas
        </button>
      </div>
    );
  }

  return (
    <div className="manual-payment">
      <h3 className="step-title">Realizar el pago</h3>

      <div className="payment-options">
        {/* Transfer info */}
        <div className="payment-info-card">
          <CreditCard size={24} />
          <h4>Datos de transferencia</h4>
          <p>Realizá el pago y subí el comprobante para confirmar tu cita.</p>
          <div className="payment-details">
            <div className="payment-detail-row">
              <span>Total a pagar</span>
              <strong>{formatPrice(amount)}</strong>
            </div>
            <div className="payment-detail-row">
              <span>WhatsApp del salón</span>
              <strong>{contactPhone}</strong>
            </div>
          </div>
          <p className="payment-note">
            <Info size={14} /> Podés consultar los datos bancarios directamente por WhatsApp al salón.
          </p>
        </div>

        {/* Upload proof */}
        <div className="proof-upload">
          <h4>Subir comprobante</h4>
          {!preview ? (
            <label className="upload-area" htmlFor="proof-upload">
              <Upload size={32} />
              <span>Hacé clic para subir la captura de pantalla</span>
              <span className="upload-hint">PNG, JPG, máx. 10MB</span>
              <input
                id="proof-upload"
                type="file"
                accept="image/*"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
            </label>
          ) : (
            <div className="proof-preview">
              <img src={preview} alt="Comprobante" />
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setFile(null); setPreview(null); }}
              >
                Cambiar imagen
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        className="btn btn-primary btn-full"
        onClick={handleSubmit}
        disabled={uploading || !file}
      >
        {uploading ? <span className="spinner-sm" /> : <Upload size={18} />}
        {uploading ? 'Enviando comprobante...' : 'Enviar comprobante'}
      </button>
    </div>
  );
};

export default ManualPayment;
