"use client";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useEffect } from 'react';

// This component will protect routes and provide the main app shell
export default function MainPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <h1 className="p-8 text-2xl">Engineering Studio</h1>
      <p className="px-8">Welcome, {user.username}. Chat interface will be built here.</p>
      {/* The Chat UI would be rendered here as a child component */}
    </div>
  );
}
