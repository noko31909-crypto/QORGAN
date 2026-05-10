import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { api } from '../services/api';
import { User } from '../types';

type AuthContextType = {
  user: User | null;
  login: (payload: { email?: string; phone?: string; password: string; school_code?: string }) => Promise<void>;
  register: (payload: { email?: string; phone?: string; password: string; role: 'guard' | 'student'; school_code: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const value = useMemo(() => ({
    user,
    login: async (payload: { email?: string; phone?: string; password: string; school_code?: string }) => {
      const data = await api.login(payload);
      setUser(data.user);
    },
    register: async (payload: { email?: string; phone?: string; password: string; role: 'guard' | 'student'; school_code: string }) => {
      const data = await api.register(payload);
      setUser(data.user);
    },
    logout: () => {
      api.clearToken();
      setUser(null);
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
