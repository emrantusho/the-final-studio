import React, { useState } from 'react';
import { useAuth } from '../lib/Auth';
import { toast } from 'sonner';

export default function LoginPage() {
    const [username, setUsername] = useState('admin'); const [password, setPassword] = useState('admin');
    const [isLoading, setIsLoading] = useState(false); const auth = useAuth();
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsLoading(true);
        try { await auth.login(username, password); toast.success("Login successful!"); }
        catch (err: any) { toast.error(err.message); }
        finally { setIsLoading(false); }
    };
    return (
        <main className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 p-8 rounded-xl shadow-lg w-full max-w-sm">
                <h1 className="text-2xl font-bold text-center mb-6 text-white">Engineering Studio</h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div><label className="text-sm text-gray-300">Username</label><input value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2 mt-1 bg-gray-700 rounded-md border border-gray-600 text-white"/></div>
                    <div><label className="text-sm text-gray-300">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 mt-1 bg-gray-700 rounded-md border border-gray-600 text-white"/></div>
                    <button type="submit" disabled={isLoading} className="p-3 bg-blue-600 rounded-md hover:bg-blue-700 mt-2 disabled:opacity-50 text-white font-semibold">{isLoading ? "Signing In..." : "Sign In"}</button>
                </form>
            </div>
        </main>
    );
}
