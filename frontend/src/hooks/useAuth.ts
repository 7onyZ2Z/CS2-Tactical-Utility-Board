import { useState, useCallback } from 'react';
import * as authApi from '../api/auth';
import type { UserResponse } from '../types';

export function useAuth() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return false;
    }
    try {
      const me = await authApi.getMe();
      setUser(me);
      setLoading(false);
      return true;
    } catch {
      localStorage.removeItem('token');
      setLoading(false);
      return false;
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await authApi.login({ username, password });
    localStorage.setItem('token', res.access_token);
    const me = await authApi.getMe();
    setUser(me);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return { user, loading, checkAuth, login, logout };
}
