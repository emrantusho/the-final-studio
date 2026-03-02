"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApi } from './api';

interface User { id: number; username: string; }
interface AuthContextType { user: User | null; isLoading: boolean; login: (username: string, password: string) => Promise<void>; logout: () => void; }
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true
  const router = useRouter();
  const pathname = usePathname();
  const api = useApi();

  useEffect(() => {
    const verifyUser = async () => {
        const token = sessionStorage.getItem('authToken');
        if (!token) {
            setUser(null);
            setIsLoading(false);
            if (pathname !== '/login') {
                router.replace('/login');
            }
            return;
        }

        try {
            const data = await api.get<{user: User}>('/auth/session');
            setUser(data.user);
        } catch (error) {
            sessionStorage.removeItem('authToken');
            setUser(null);
            if (pathname !== '/login') {
                router.replace('/login');
            }
        } finally {
            setIsLoading(false);
        }
    };
    verifyUser();
  }, [pathname]); // Rerunning this on every path change ensures protected routes

  const login = async (username: string, password: string) => {
    const { token, user: userData } = await api.post<{token: string, user: User}>('/auth/login', { username, password });
    sessionStorage.setItem('authToken', token);
    setUser(userData);
    router.push('/'); // Redirect to main app page after login
  };

  const logout = () => {
    sessionStorage.removeItem('authToken');
    setUser(null);
    router.push('/login');
  };

  if (isLoading) {
    return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">Authenticating...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => { const context = useContext(AuthContext); if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); } return context; };
