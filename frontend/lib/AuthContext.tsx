"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useApi } from './api';
interface User { id: number; username: string; }
interface AuthContextType { user: User | null; isLoading: boolean; login: (username: string, password: string) => Promise<void>; logout: () => void; }
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); const [isLoading, setIsLoading] = useState(true); const router = useRouter(); const pathname = usePathname(); const api = useApi();
  const checkSession = useCallback(async () => {
    try {
        const data = await api.get<{user: User | null}>('/auth/session');
        if (data.user) { setUser(data.user); }
        else { setUser(null); if (pathname !== '/login') { router.push('/login'); } }
    } catch (error) { setUser(null); if (pathname !== '/login') { router.push('/login'); } }
    finally { setIsLoading(false); }
  }, [api, router, pathname]);
  
  const login = async (username: string, password: string) => {
    const userData = await api.post<User>('/auth/login', { username, password, turnstileToken: 'not-used' });
    setUser(userData);
  };
  const logout = async () => {
    try { await api.post('/auth/logout', {}); } catch(e) { console.error("Logout failed", e) }
    finally { setUser(null); toast.info("You have been logged out."); router.push('/login'); }
  };
  return ( <AuthContext.Provider value={{ user, isLoading, login, logout }}> {children} </AuthContext.Provider> );
};
export const useAuth = () => { const context = useContext(AuthContext); if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); } return context; };
