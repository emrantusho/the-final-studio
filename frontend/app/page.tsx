"use client";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useEffect } from 'react';
import Link from 'next/link';

export default function MainPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // When loading is finished, if there is no user, redirect to login.
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  // Show a loading screen while the AuthContext is initializing.
  if (isLoading || !user) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
        Loading Studio...
      </div>
    );
  }

  // If we have a user, show the main application.
  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <header className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Engineering Studio</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {user.username}</span>
          <Link href="/admin" className="text-sm text-blue-400 hover:underline">Admin Dashboard</Link>
          <button onClick={logout} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition">Log Out</button>
        </div>
      </header>
      <main className="p-8">
        <h2 className="text-2xl">Main Chat Interface</h2>
        <p className="text-gray-400 mt-2">The full chat UI and features will be built here.</p>
      </main>
    </div>
  );
}
