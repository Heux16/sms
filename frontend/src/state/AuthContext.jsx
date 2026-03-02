import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, clearAuthToken, getAuthToken, setAuthToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    apiRequest('/api/auth/me')
      .then((result) => {
        if (mounted) {
          setUser(result.user);
        }
      })
      .catch(() => {
        clearAuthToken();
        if (mounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(username, password) {
        const result = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });
        setAuthToken(result.token);
        setUser(result.user);
        return result.user;
      },
      async logout() {
        try {
          await apiRequest('/api/auth/logout', { method: 'POST' });
        } catch {
        }
        clearAuthToken();
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
