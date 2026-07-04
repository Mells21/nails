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
import { MessageCircle, ArrowLeft, Check, X, AlertTriangle, Image, User, Phone, Mail, Scissors, Calendar, Clock, DollarSign, Receipt } from 'lucide-react';
import { toast } from '../../utils/toast';
import { DetailCardSkeleton } from '../../components/ui/CardSkeletons';
import Skeleton from '../../components/ui/Skeleton';
import { confirmAction } from '../../utils/confirmToast';

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
      toast.success('Cita confirmada');
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

  const handleCancel = () => {
    confirmAction({
      title: '¿Cancelar esta cita?',
      description: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Cancelar cita',
      onConfirm: async () => {
        setActing(true);
        try {
          await cancelAppointment(id);
          toast.success('Cita cancelada');
          reload();
        } catch (err) {
          toast.error(err.message || 'Error al cancelar.');
        } finally { setActing(false); }
      },
    });
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

  if (loading) {
    return (
      <div className="admin-page">
        <Skeleton style={{ width: 130, height: 30, marginBottom: 20 }} />
        <div className="page-header">
          <h1>Ficha de la cita</h1>
        </div>
        <div className="detail-grid">
          <DetailCardSkeleton />
          <DetailCardSkeleton />
        </div>
      </div>
    );
  }
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
          <h3><User size={18} /> Clienta</h3>
          <p><strong>{apt.clientName}</strong></p>
          <p><Phone size={14} /> {apt.clientPhone}</p>
          <p><Mail size={14} /> {apt.clientEmail}</p>
        </div>

        <div className="detail-card">
          <h3><Scissors size={18} /> Servicio</h3>
          <p><strong>{apt.serviceName}</strong></p>
          <p><Calendar size={14} /> {toReadableDate(apt.date)}</p>
          <p><Clock size={14} /> {to12h(apt.time)}</p>
          <p><DollarSign size={14} /> {formatPrice(apt.servicePrice)}</p>
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
            <h3><Receipt size={18} /> Comprobante de pago</h3>
            <a href={paymentProofSignedUrl} target="_blank" rel="noreferrer">
              <img src={paymentProofSignedUrl} alt="Comprobante" className="proof-thumb" />
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="detail-actions">
        <h3>Acciones</h3>

        <div className="actions-columns">
          {['pending_validation', 'confirmed', 'pending_payment'].includes(apt.status) && (
            <div className="actions-group">
              <h4>Estado de la cita</h4>
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
              </div>
              {['confirmed', 'pending_validation', 'pending_payment'].includes(apt.status) && (
                <div className="actions-row actions-row-secondary">
                  <button className="btn btn-outline btn-sm" onClick={handleNoShow} disabled={acting}>
                    <AlertTriangle size={14} /> No asistió
                  </button>
                  <button className="btn btn-outline-danger btn-sm" onClick={handleCancel} disabled={acting}>
                    <X size={14} /> Cancelar cita
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="actions-group actions-group-whatsapp">
            <h4><MessageCircle size={14} /> WhatsApp a la clienta</h4>
            <div className="actions-row">
              <button className="btn btn-whatsapp" onClick={sendConfirmation}>
                <MessageCircle size={16} /> Confirmación
              </button>
              <button className="btn btn-whatsapp-outline" onClick={sendReminder}>
                <MessageCircle size={16} /> Recordatorio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;
