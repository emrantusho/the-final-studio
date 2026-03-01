"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useApi } from './api';

interface User { id: number; username: string; }
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true
  const router = useRouter();
  const api = useApi();

  useEffect(() => {
    // In a static app, we can't reliably check the server session on first load.
    // We simply finish the initial loading state.
    // Route protection will be handled by components that use this context.
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    // Note: We removed Turnstile for simplicity.
    const userData = await api.post<User>('/auth/login', { username, password });
    setUser(userData);
  };

  const logout = async () => {
    try {
      // It's good practice to tell the backend to clear the cookie, even if we clear it on the client.
      await api.post('/auth/logout', {});
    } catch (e) {
      console.error("Logout API call failed, but proceeding with client-side logout.", e);
    } finally {
      setUser(null);
      toast.info("You have been logged out.");
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
