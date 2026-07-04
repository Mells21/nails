import { supabase } from '../lib/supabase';

const mapAppointment = (row) => row && ({
  id: row.id,
  clientId: row.client_id,
  serviceId: row.service_id,
  serviceName: row.service_name,
  servicePrice: Number(row.service_price),
  serviceDuration: row.service_duration,
  date: row.date,
  time: row.time?.slice(0, 5),
  status: row.status,
  referencePhotos: row.reference_photos || [],
  paymentProofUrl: row.payment_proof_url,
  cancelReason: row.cancel_reason,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Igual que mapAppointment, pero además aplana los datos de la clienta
 * (vienen de un join embebido con profiles). Solo lo puede pedir un admin
 * (RLS de profiles exige ser dueño del perfil o admin).
 */
const mapAppointmentWithClient = (row) => row && ({
  ...mapAppointment(row),
  clientName: row.profile?.name,
  clientPhone: row.profile?.phone,
  clientEmail: row.profile?.email,
});

const WITH_CLIENT_SELECT = '*, profile:profiles(name, phone, email)';

/**
 * Crea una cita para la clienta autenticada (status inicial: pending_payment).
 * El id se genera del lado del cliente para poder subir las fotos de
 * referencia ANTES del insert (así no hace falta un UPDATE posterior, que
 * la clienta no tiene permitido por RLS).
 */
export const createAppointment = async ({
  id,
  clientId,
  serviceId,
  serviceName,
  servicePrice,
  serviceDuration,
  date,
  time,
  referencePhotos = [],
}) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      id,
      client_id: clientId,
      service_id: serviceId,
      service_name: serviceName,
      service_price: servicePrice,
      service_duration: serviceDuration,
      date,
      time,
      reference_photos: referencePhotos,
    })
    .select()
    .single();
  if (error) throw error;
  return mapAppointment(data);
};

/**
 * Horarios ya ocupados (bloqueantes) para una fecha puntual.
 * Usa una RPC porque el RLS de appointments solo deja ver las citas
 * propias, esta función expone solo el horario, no el resto de datos.
 */
export const getBookedSlots = async (date) => {
  const { data, error } = await supabase.rpc('get_booked_slots', { p_date: date });
  if (error) throw error;
  return data.map((row) => ({ time: row.slot_time?.slice(0, 5) }));
};

/**
 * Envía el comprobante de pago (path del bucket, no URL pública).
 * Pasa la cita a pending_validation. Usa una RPC para no necesitar
 * darle a la clienta permiso de UPDATE libre sobre appointments.
 */
export const submitPaymentProof = async (appointmentId, proofPath) => {
  const { error } = await supabase.rpc('submit_payment_proof', {
    p_appointment_id: appointmentId,
    p_proof_url: proofPath,
  });
  if (error) throw error;
};

/**
 * Historial de citas de la propia clienta.
 */
export const getClientAppointments = async (clientId) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data.map(mapAppointment);
};

/**
 * Todas las citas (admin), con nombre/teléfono/email de la clienta.
 */
export const getAllAppointments = async (statusFilter = null) => {
  let query = supabase.from('appointments').select(WITH_CLIENT_SELECT).order('date', { ascending: true });
  if (statusFilter) query = query.eq('status', statusFilter);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapAppointmentWithClient);
};

/**
 * Una cita puntual (admin), con los datos de la clienta.
 */
export const getAppointment = async (id) => {
  const { data, error } = await supabase
    .from('appointments')
    .select(WITH_CLIENT_SELECT)
    .eq('id', id)
    .single();
  if (error) throw error;
  return mapAppointmentWithClient(data);
};

/**
 * Cambia el estado de una cita (admin). El RLS ya restringe el UPDATE
 * de appointments a solo admins, no hace falta una RPC acá.
 */
export const updateAppointmentStatus = async (id, status, extra = {}) => {
  const { error } = await supabase.from('appointments').update({ status, ...extra }).eq('id', id);
  if (error) throw error;
};

export const confirmManualPayment = async (id) => {
  await updateAppointmentStatus(id, 'confirmed');
};

export const cancelAppointment = async (id, reason = '') => {
  await updateAppointmentStatus(id, 'cancelled', { cancel_reason: reason });
};
