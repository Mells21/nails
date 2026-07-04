import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAppointment,
  updateAppointmentStatus,
  confirmManualPayment,
  cancelAppointment,
} from '../../api/appointments';
import { getSignedUrl } from '../../api/storage';
import Badge from '../../components/ui/Badge';
import { toReadableDate, to12h, formatPrice } from '../../utils/dates';
import { buildConfirmationMessage, buildReminderMessage, openWhatsApp } from '../../utils/whatsapp';
import { MessageCircle, ArrowLeft, Check, X, AlertTriangle, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apt, setApt] = useState(null);
  const [referencePhotoUrls, setReferencePhotoUrls] = useState([]);
  const [paymentProofSignedUrl, setPaymentProofSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const reload = () => {
    setLoading(true);
    getAppointment(id)
      .then(async (data) => {
        setApt(data);
        const [photoUrls, proofUrl] = await Promise.all([
          Promise.all((data.referencePhotos || []).map((path) => getSignedUrl('reference-photos', path).catch(() => null))),
          data.paymentProofUrl ? getSignedUrl('payment-proofs', data.paymentProofUrl).catch(() => null) : null,
        ]);
        setReferencePhotoUrls(photoUrls.filter(Boolean));
        setPaymentProofSignedUrl(proofUrl);
      })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [id]);

  const handleConfirm = async () => {
    setActing(true);
    try {
      await confirmManualPayment(id);
      toast.success('Cita confirmada ✅');
      reload();
    } catch (err) {
      toast.error(err.message || 'Error al confirmar.');
    } finally { setActing(false); }
  };

  const handleComplete = async () => {
    setActing(true);
    try {
      await updateAppointmentStatus(id, 'completed');
      toast.success('Cita marcada como completada');
      reload();
    } catch (err) {
      toast.error(err.message || 'Error al actualizar.');
    } finally { setActing(false); }
  };

  const handleCancel = async () => {
    if (!confirm('¿Segura que querés cancelar esta cita?')) return;
    setActing(true);
    try {
      await cancelAppointment(id);
      toast.success('Cita cancelada');
      reload();
    } catch (err) {
      toast.error(err.message || 'Error al cancelar.');
    } finally { setActing(false); }
  };

  const handleNoShow = async () => {
    setActing(true);
    try {
      await updateAppointmentStatus(id, 'no_show');
      toast.success('Registrado como inasistencia');
      reload();
    } catch (err) {
      toast.error(err.message || 'Error al actualizar.');
    } finally { setActing(false); }
  };

  const sendConfirmation = () => {
    const msg = buildConfirmationMessage({
      clientName: apt.clientName,
      date: apt.date,
      time: apt.time,
      service: apt.serviceName,
    });
    openWhatsApp(apt.clientPhone, msg);
  };

  const sendReminder = () => {
    const msg = buildReminderMessage({
      clientName: apt.clientName,
      date: apt.date,
      time: apt.time,
      service: apt.serviceName,
    });
    openWhatsApp(apt.clientPhone, msg);
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!apt) return <div className="page-container"><p>Cita no encontrada.</p></div>;

  return (
    <div className="admin-page">
      <button className="btn btn-ghost btn-sm back-btn" onClick={() => navigate('/admin/citas')}>
        <ArrowLeft size={16} /> Volver a citas
      </button>

      <div className="page-header">
        <h1>Ficha de la cita</h1>
        <Badge status={apt.status} />
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>👤 Clienta</h3>
          <p><strong>{apt.clientName}</strong></p>
          <p>📱 {apt.clientPhone}</p>
          <p>✉️ {apt.clientEmail}</p>
        </div>

        <div className="detail-card">
          <h3>💅 Servicio</h3>
          <p><strong>{apt.serviceName}</strong></p>
          <p>📅 {toReadableDate(apt.date)}</p>
          <p>⏰ {to12h(apt.time)}</p>
          <p>💰 {formatPrice(apt.servicePrice)}</p>
        </div>

        {/* Reference photos */}
        {referencePhotoUrls.length > 0 && (
          <div className="detail-card full-width">
            <h3><Image size={18} /> Fotos de referencia</h3>
            <div className="reference-photos-grid">
              {referencePhotoUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`Referencia ${i + 1}`} className="reference-thumb" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Payment proof */}
        {paymentProofSignedUrl && (
          <div className="detail-card full-width">
            <h3>🧾 Comprobante de pago</h3>
            <a href={paymentProofSignedUrl} target="_blank" rel="noreferrer">
              <img src={paymentProofSignedUrl} alt="Comprobante" className="proof-thumb" />
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="detail-actions">
        <h3>Acciones</h3>
        <div className="actions-row">
          {apt.status === 'pending_validation' && (
            <button className="btn btn-success" onClick={handleConfirm} disabled={acting}>
              <Check size={16} /> Confirmar pago
            </button>
          )}
          {apt.status === 'confirmed' && (
            <button className="btn btn-primary" onClick={handleComplete} disabled={acting}>
              <Check size={16} /> Marcar completada
            </button>
          )}
          {['confirmed', 'pending_validation', 'pending_payment'].includes(apt.status) && (
            <>
              <button className="btn btn-outline" onClick={handleNoShow} disabled={acting}>
                <AlertTriangle size={16} /> No asistió
              </button>
              <button className="btn btn-danger" onClick={handleCancel} disabled={acting}>
                <X size={16} /> Cancelar cita
              </button>
            </>
          )}
        </div>

        <div className="actions-row">
          <button className="btn btn-whatsapp" onClick={sendConfirmation}>
            <MessageCircle size={16} /> Enviar confirmación WA
          </button>
          <button className="btn btn-whatsapp-outline" onClick={sendReminder}>
            <MessageCircle size={16} /> Enviar recordatorio WA
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;
