"use client";
import { useState } from 'react'; import { useRouter } from 'next/navigation'; import { toast } from 'sonner'; import { useAuth } from '@/lib/AuthContext';
export default function LoginPage() {
    const [username, setUsername] = useState('admin'); const [password, setPassword] = useState('admin'); const [isLoading, setIsLoading] = useState(false); const router = useRouter(); const { login } = useAuth();
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsLoading(true);
        try { await login(username, password); toast.success("Login successful!"); router.push('/'); } catch (error: any) { toast.error(error.message); } finally { setIsLoading(false); }
    };
    return (
        <main style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#111827' }}>
            <div style={{ background: 'rgba(31, 41, 55, 0.7)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(75, 85, 99, 0.5)', color: 'white', width: '380px' }}>
                <h1 style={{ fontSize: '1.875rem', textAlign: 'center', marginBottom: '1.5rem', fontWeight: 'bold' }}>Engineering Studio</h1>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div> <label htmlFor="username" style={{display: 'block', marginBottom: '0.5rem'}}>Username</label> <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={{width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '0.375rem', color: 'white'}} /> </div>
                    <div> <label htmlFor="password" style={{display: 'block', marginBottom: '0.5rem'}}>Password</label> <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{width: '100%', padding: '0.5rem', background: '#374151', border: '1px solid #4b5563', borderRadius: '0.375rem', color: 'white'}} /> </div>
                    <button type="submit" disabled={isLoading} style={{padding: '0.75rem', background: '#3b82f6', border: 'none', borderRadius: '0.375rem', color: 'white', cursor: 'pointer', opacity: isLoading ? 0.5 : 1, fontWeight: '600', marginTop: '1rem'}}> {isLoading ? 'Signing In...' : 'Sign In'} </button>
                </form>
            </div>
        </main>
    );
}
