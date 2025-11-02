import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthAPI } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
        if (token) {
          try {
            const u = await AuthAPI.me();
            if (mounted) setUser(u);
            if (u) setIsAuthenticated(true);
          } catch (e) {
            localStorage.removeItem('auth_token');
            if (mounted) {
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization failed', err);
      } finally {
        if (mounted) setIsAuthLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('auth', JSON.stringify({ isAuthenticated, user }));
    } catch {}
  }, [isAuthenticated, user]);

 
  const login = async ({ email, password, remember = true }) => {
    if (!email || !password) throw new Error('Email and password are required');
    const data = await AuthAPI.login({ email, password });
    const token = data?.token;
    if (!token) throw new Error('No token returned');
    try {
      if (remember) localStorage.setItem('auth_token', token);
      else sessionStorage.setItem('auth_token', token);
    } catch {}
    setUser(data?.user || null);
    setIsAuthenticated(true);
    return data?.user;
  };

  // register accepts same options as before; if form.remember === false, store in sessionStorage
  const register = async (form) => {
    const reg = await AuthAPI.register(form);
    const token = reg?.token;
    try {
      if (token) {
        const remember = form?.remember !== false; // default true
        if (remember) localStorage.setItem('auth_token', token);
        else sessionStorage.setItem('auth_token', token);
      }
    } catch {}
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
    try {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    } catch {}
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
