import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('gg_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const initData = window.Telegram?.WebApp?.initData;
      if (!initData && !token) {
        setError('open_in_telegram');
        setLoading(false);
        return;
      }
      if (!token && initData) {
        window.Telegram?.WebApp?.ready?.();
        try {
          const { data } = await api.post('/auth/telegram', { initData });
          if (cancelled) return;
          localStorage.setItem('gg_token', data.token);
          setToken(data.token);
          setAuthToken(data.token);
          setUser(data.user);
          setError(null);
        } catch (e) {
          if (!cancelled) setError('auth_failed');
          console.log('[auth]', e?.response?.data || e?.message);
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }
      if (token) {
        setAuthToken(token);
        try {
          const { data } = await api.get('/users/me');
          if (!cancelled) {
            setUser(data);
            setError(null);
          }
        } catch {
          localStorage.removeItem('gg_token');
          if (!cancelled) {
            setToken('');
            setAuthToken(null);
            setUser(null);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      error,
      refreshUser: () => api.get('/users/me').then(({ data }) => setUser(data)),
      logout: () => {
        localStorage.removeItem('gg_token');
        setToken('');
        setUser(null);
        setAuthToken(null);
      },
    }),
    [token, user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth');
  return ctx;
}
