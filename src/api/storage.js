import { supabase } from '../lib/supabase';

const REFERENCE_BUCKET = 'reference-photos';
const PAYMENT_PROOFS_BUCKET = 'payment-proofs';

/**
 * Sube una foto de referencia y devuelve el PATH dentro del bucket
 * (no una URL pública: el bucket es privado). Las URLs se generan al
 * vuelo con getSignedUrl cuando hace falta mostrar la imagen.
 */
export const uploadReferencePhoto = async (file, clientId, appointmentId, index) => {
  const ext = file.name.split('.').pop();
  const path = `${clientId}/${appointmentId}/${index}.${ext}`;
  const { error } = await supabase.storage.from(REFERENCE_BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
};

/**
 * Sube el comprobante de pago y devuelve el PATH dentro del bucket
 * (bucket privado, mismo criterio que las fotos de referencia).
 */
export const uploadPaymentProof = async (file, clientId, appointmentId) => {
  const ext = file.name.split('.').pop();
  const path = `${clientId}/${appointmentId}/proof.${ext}`;
  const { error } = await supabase.storage.from(PAYMENT_PROOFS_BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
};

/**
 * Genera una URL firmada temporal para ver un archivo de un bucket privado.
 */
export const getSignedUrl = async (bucket, path, expiresInSeconds = 3600) => {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
};
