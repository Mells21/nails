import { supabase } from '../lib/supabase';
import { toWebP } from '../utils/imageOptimize';

const BUCKET = 'catalog';

/**
 * Extrae el path dentro del bucket a partir de la URL pública guardada
 * (ej. ".../object/public/catalog/abc-123.jpg" -> "abc-123.jpg").
 */
const getStoragePath = (imageUrl) => {
  if (!imageUrl) return null;
  const marker = `/object/public/${BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  return idx === -1 ? null : imageUrl.slice(idx + marker.length);
};

const removeStorageFile = async (path) => {
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error('No se pudo borrar la imagen del storage:', error.message);
};

const mapService = (row) => row && ({
  id: row.id,
  name: row.name,
  description: row.description,
  duration: row.duration_minutes,
  price: Number(row.price),
  color: row.color,
  imageUrl: row.image_url,
  active: row.active,
  sortOrder: row.sort_order,
});

/**
 * Catálogo público (landing, reserva): solo servicios activos.
 */
export const getActiveServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data.map(mapService);
};

/**
 * Catálogo completo (admin): activos e inactivos.
 */
export const getAllServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data.map(mapService);
};

export const createService = async ({ name, description, duration, price, color, sortOrder = 0 }) => {
  const { data, error } = await supabase
    .from('services')
    .insert({
      name,
      description,
      duration_minutes: duration,
      price,
      color,
      sort_order: sortOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return mapService(data);
};

export const updateService = async (id, { name, description, duration, price, color, active, sortOrder }) => {
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (description !== undefined) patch.description = description;
  if (duration !== undefined) patch.duration_minutes = duration;
  if (price !== undefined) patch.price = price;
  if (color !== undefined) patch.color = color;
  if (active !== undefined) patch.active = active;
  if (sortOrder !== undefined) patch.sort_order = sortOrder;

  const { data, error } = await supabase
    .from('services')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapService(data);
};

export const deleteService = async (id) => {
  const { data: existing } = await supabase.from('services').select('image_url').eq('id', id).single();

  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;

  await removeStorageFile(getStoragePath(existing?.image_url));
};

/**
 * Quita la imagen de un servicio (deja de mostrar imagen, vuelve al ícono genérico)
 * y la borra del storage.
 */
export const removeServiceImage = async (serviceId) => {
  const { data: existing } = await supabase.from('services').select('image_url').eq('id', serviceId).single();

  const { data, error } = await supabase
    .from('services')
    .update({ image_url: null })
    .eq('id', serviceId)
    .select()
    .single();
  if (error) throw error;

  await removeStorageFile(getStoragePath(existing?.image_url));
  return mapService(data);
};

/**
 * Sube/reemplaza la imagen de un servicio y actualiza image_url.
 * Si ya había una imagen con un path distinto (ej. otra extensión),
 * se borra del storage para no dejar archivos huérfanos.
 */
export const uploadServiceImage = async (file, serviceId) => {
  const webpFile = await toWebP(file);
  const path = `${serviceId}.webp`;

  const { data: existing } = await supabase.from('services').select('image_url').eq('id', serviceId).single();
  const oldPath = getStoragePath(existing?.image_url);
  if (oldPath && oldPath !== path) {
    await removeStorageFile(oldPath);
  }

  const { error: uploadError } = await supabase
    .storage
    .from(BUCKET)
    .upload(path, webpFile, { upsert: true });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from('services')
    .update({ image_url: publicUrlData.publicUrl })
    .eq('id', serviceId)
    .select()
    .single();
  if (error) throw error;
  return mapService(data);
};
