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
  const checkSession = useCallback(async () => { setIsLoading(false); }, []);
  useEffect(() => { checkSession(); }, [checkSession]);
  const login = async (username: string, password: string) => { const userData = await api.post<User>('/auth/login', { username, password }); setUser(userData); };
  const logout = async () => { setUser(null); router.push('/login'); };
  return ( <AuthContext.Provider value={{ user, isLoading, login, logout }}> {children} </AuthContext.Provider> );
};
export const useAuth = () => { const context = useContext(AuthContext); if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); } return context; };
