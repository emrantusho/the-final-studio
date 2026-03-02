"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useApi } from './api';
interface User { id: number; username: string; }
interface AuthContextType { user: User | null; isLoading: boolean; login: (username: string, password: string) => Promise<void>; logout: () => void; }
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); const [isLoading, setIsLoading] = useState(true); const router = useRouter(); const api = useApi();
  const checkSession = useCallback(async () => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
        try {
            const data = await api.get<{user: User}>('/auth/session');
            setUser(data.user);
        } catch (error) { sessionStorage.removeItem('authToken'); setUser(null); }
    }
    setIsLoading(false);
  }, [api]);
  useEffect(() => { checkSession(); }, [checkSession]);
  const login = async (username: string, password: string) => {
    const { token, user: userData } = await api.post<{token: string, user: User}>('/auth/login', { username, password });
    sessionStorage.setItem('authToken', token);
    setUser(userData);
  };
  const logout = () => { sessionStorage.removeItem('authToken'); setUser(null); router.push('/login'); };
  return ( <AuthContext.Provider value={{ user, isLoading, login, logout }}> {children} </AuthContext.Provider> );
};
export const useAuth = () => { const context = useContext(AuthContext); if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); } return context; };
