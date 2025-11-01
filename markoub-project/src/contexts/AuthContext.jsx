import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthAPI } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsAuthLoading(true);
        const raw = localStorage.getItem('auth');
        const token = localStorage.getItem('auth_token');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            setIsAuthenticated(!!parsed.isAuthenticated && !!token);
            setUser(parsed.user || null);
          }
        }
        // If token exists, try to refresh user from /me to validate token
        if (token) {
          try {
            const u = await AuthAPI.me();
            if (mounted) setUser(u);
            if (u) setIsAuthenticated(true);
          } catch (e) {
            // invalid token, clear
            localStorage.removeItem('auth_token');
            if (mounted) {
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        }
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setIsAuthLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Persist to localStorage when auth changes
  useEffect(() => {
    try {
      localStorage.setItem('auth', JSON.stringify({ isAuthenticated, user }));
    } catch {}
  }, [isAuthenticated, user]);

  const login = async ({ email, password }) => {
    if (!email || !password) throw new Error('Email and password are required');
    const data = await AuthAPI.login({ email, password });
    const token = data?.token;
    if (!token) throw new Error('No token returned');
    localStorage.setItem('auth_token', token);
    setUser(data?.user || null);
    setIsAuthenticated(true);
    return data?.user;
  };

  const register = async (form) => {
    const reg = await AuthAPI.register(form);
    const token = reg?.token;
    if (token) localStorage.setItem('auth_token', token);
    setUser(reg?.user || null);
    setIsAuthenticated(true);
    return reg?.user;
  };

  const updateProfile = async (payload) => {
    try {
      await AuthAPI.updateProfile(payload);
      // refresh current user
      const u = await AuthAPI.me();
      setUser(u);
      setIsAuthenticated(!!u);
      return u;
    } catch (e) {
      throw e;
    }
  };

  const logout = async () => {
    try { await AuthAPI.logout(); } catch {}
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = useMemo(
    () => ({ isAuthenticated, user, login, register, logout, isAuthLoading, updateProfile }),
    [isAuthenticated, user, isAuthLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
