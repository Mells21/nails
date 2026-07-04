import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// TODO: wire up Supabase auth here (session listener + user profile fetch).
export const AuthProvider = ({ children }) => {
  const [user] = useState(null);
  const [profile] = useState(null);
  const [loading] = useState(false);

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
