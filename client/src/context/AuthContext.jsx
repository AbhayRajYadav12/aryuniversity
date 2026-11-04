import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setCsrfToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [watermark, setWatermark] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      await api('/api/auth/csrf');
      const me = await api('/api/auth/me');
      setUser(me.user);
      setWatermark(me.watermark);
    } catch {
      setUser(null);
      setWatermark(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (data.csrfToken) setCsrfToken(data.csrfToken);
    setUser(data.user);
    const me = await api('/api/auth/me');
    setWatermark(me.watermark);
    return data.user;
  };

  const logout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setWatermark(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, watermark, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
