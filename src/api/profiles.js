import { supabase } from '../lib/supabase';

/**
 * Normaliza una fila de "profiles" (snake_case) al shape camelCase
 * que usa el resto del frontend.
 */
export const mapProfile = (row) => row && ({
  id: row.id,
  role: row.role,
  name: row.name,
  phone: row.phone,
  email: row.email,
  favoriteColors: row.favorite_colors,
  allergies: row.allergies,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Actualiza el propio perfil de la clienta (nombre, teléfono, preferencias).
 * No permite tocar "role" ni las notas privadas de la dueña (client_notes).
 */
export const updateOwnProfile = async (uid, { name, phone, favoriteColors, allergies }) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ name, phone, favorite_colors: favoriteColors, allergies })
    .eq('id', uid)
    .select()
    .single();
  if (error) throw error;
  return mapProfile(data);
};

/**
 * Teléfono de la dueña (usuario con role=admin), vía RPC porque el RLS
 * de profiles no deja leer perfiles ajenos directamente.
 */
export const getAdminPhone = async () => {
  const { data, error } = await supabase.rpc('get_admin_phone');
  if (error) throw error;
  return data;
};

/**
 * Todas las clientas (admin, CRM).
 */
export const getAllClients = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('name', { ascending: true });
  if (error) throw error;
  return data.map(mapProfile);
};

/**
 * Nota privada de la dueña sobre una clienta (tabla aparte, nunca visible
 * para la clienta — separada de favoriteColors/allergies).
 */
export const getClientNote = async (clientId) => {
  const { data, error } = await supabase
    .from('client_notes')
    .select('note')
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) throw error;
  return data?.note || '';
};

export const upsertClientNote = async (clientId, note) => {
  const { error } = await supabase
    .from('client_notes')
    .upsert({ client_id: clientId, note }, { onConflict: 'client_id' });
  if (error) throw error;
};
