import { supabase } from '../lib/supabase';
import { mapProfile } from './profiles';

/**
 * Register a new client user. El perfil en "profiles" se crea solo
 * vía trigger (handle_new_user) usando el name/phone del metadata.
 */
export const registerClient = async ({ email, password, name, phone }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, phone } },
  });
  if (error) throw error;
  return data;
};

/**
 * Login with email and password
 */
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
};

/**
 * Logout current user
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Get user profile from "profiles" (incluye el rol)
 */
export const getUserProfile = async (uid) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single();
  if (error) throw error;
  return mapProfile(data);
};
