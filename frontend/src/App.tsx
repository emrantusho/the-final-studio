import { useState, useEffect, ReactNode } from 'react';
import { toast, Toaster } from 'sonner';

// --- API Client (self-contained) ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getAuthToken() { return sessionStorage.getItem('authToken'); }

const api = {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (!(options.body instanceof FormData)) { headers.set('Content-Type', 'application/json'); }
    const token = getAuthToken();
    if (token) { headers.set('Authorization', `Bearer ${token}`); }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
        if (response.status === 401) { sessionStorage.removeItem('authToken'); window.location.reload(); }
        const errorData = await response.json().catch(() => ({ error: 'An unknown network error occurred' }));
        throw new Error(errorData.error || 'An unknown error occurred');
    }
    if (response.status === 204) return null as T;
    return response.json();
  },
  get<T>(endpoint: string): Promise<T> { return this.request(endpoint, { method: 'GET' }); },
  post<T>(endpoint: string, body: any): Promise<T> { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); },
  put<T>(endpoint: string, body: any): Promise<T> { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); }
};

// --- Auth State ---
interface User { id: number; username: string; }

function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (getAuthToken()) {
        try {
          const data = await api.get<{ user: User }>('/auth/session');
          setUser(data.user);
        } catch (error) {
          sessionStorage.removeItem('authToken');
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    verifyUser();
  }, []);

  const login = async (username: string, password: string) => {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/login', { username, password });
    sessionStorage.setItem('authToken', token);
    setUser(user);
  };

  const logout = () => {
    sessionStorage.removeItem('authToken');
    setUser(null);
  };

  return { user, isLoading, login, logout };
}

// --- UI Components ---
const Card = ({ children, className }: { children: ReactNode, className?: string }) => <div className={`bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg ${className}`}>{children}</div>;
const CardHeader = ({ children }: { children: ReactNode }) => <div className="p-6">{children}</div>;
const CardTitle = ({ children }: { children: ReactNode }) => <h2 className="text-xl font-bold text-white">{children}</h2>;
const CardDescription = ({ children }: { children: ReactNode }) => <p className="text-sm text-gray-400 mt-1">{children}</p>;
const CardContent = ({ children, className }: { children: ReactNode, className?: string }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

// --- Pages ---

function LoginPage({ onLogin }: { onLogin: (u: string, p: string) => Promise<void> }) {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onLogin(username, password);
            toast.success("Login successful!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <main className="flex items-center justify-center min-h-screen">
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-sm">
            <h1 className="text-2xl font-bold text-center mb-6">Engineering Studio</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div><label className="text-sm">Username</label><input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2 mt-1 bg-gray-700 rounded-md border border-gray-600"/></div>
              <div><label className="text-sm">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 mt-1 bg-gray-700 rounded-md border border-gray-600"/></div>
              <button type="submit" disabled={isLoading} className="p-3 bg-blue-600 rounded-md hover:bg-blue-700 mt-2 disabled:opacity-50">{isLoading ? "Signing In..." : "Sign In"}</button>
            </form>
          </div>
        </main>
    );
}

function AdminPage() {
    // This is a placeholder for the full admin dashboard logic
    // You would fetch keys and settings here as before.
    return <div>The Full Admin Dashboard UI would go here.</div>
}

function StudioPage({ user, onLogout }: { user: User, onLogout: () => void }) {
    // This will hold the chat interface
    return (
        <div className="min-h-screen flex flex-col">
            <header className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
                <h1 className="text-xl font-bold">Engineering Studio</h1>
                <div className="flex items-center gap-4">
                    <span>Welcome, {user.username}</span>
                    <button onClick={() => window.location.hash = '#admin'} className="text-sm text-blue-400 hover:underline">Admin</button>
                    <button onClick={onLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition">Log Out</button>
                </div>
            </header>
            <main className="p-4 sm:p-8 flex-1">
                <h2 className="text-2xl">Main Chat Interface</h2>
                <p className="text-gray-400 mt-2">The chat UI will be built here.</p>
            </main>
        </div>
    )
}

// --- Main App Component ---
function App() {
  const { user, isLoading, login, logout } = useAuth();
  const [page, setPage] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setPage(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Authenticating...</div>;
  }

  if (!user) {
    return (
        <>
            <Toaster />
            <LoginPage onLogin={login} />
        </>
    );
  }

  // Simple hash-based routing
  let content;
  if (page === '#admin') {
      content = <AdminPage />;
  } else {
      content = <StudioPage user={user} onLogout={logout} />;
  }

  return (
    <>
      <Toaster />
      {content}
    </>
  );
}

export default App;
