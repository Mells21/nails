import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserProfile } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const syncSession = async (sessionUser) => {
      if (!sessionUser) {
        if (active) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
        return;
      }
      const userProfile = await getUserProfile(sessionUser.id).catch(() => null);
      if (active) {
        setUser(sessionUser);
        setProfile(userProfile);
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Si hay sesión, marcamos loading=true de inmediato (antes de esperar
      // el fetch del perfil) para que ProtectedRoute muestre el spinner en
      // vez de concluir "no logueado" mientras el perfil todavía viaja.
      if (session?.user) setLoading(true);
      syncSession(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = profile?.role === 'admin';
  const isClient = profile?.role === 'client';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isClient }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
