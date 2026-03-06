import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';
interface User { id: number; username: string; }
interface AuthContextType { user: User | null; isLoading: boolean; login: (u: string, p: string) => Promise<void>; logout: () => void; }
const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const verify = async () => {
      if (sessionStorage.getItem('authToken')) {
        try { const data = await api.get<{user: User}>('/auth/session'); setUser(data.user); }
        catch (e) { sessionStorage.removeItem('authToken'); setUser(null); }
      } setIsLoading(false);
    }; verify();
  }, []);
  const login = async (username: string, password: string) => {
    const { token, user } = await api.post<{token: string, user: User}>('/auth/login', { username, password });
    sessionStorage.setItem('authToken', token); setUser(user);
  };
  const logout = () => { sessionStorage.removeItem('authToken'); setUser(null); };
  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext)!;
