import { useState } from 'react';

// IMPORTANT: Vite uses import.meta.env for environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    try {
      if (!API_BASE_URL) {
        throw new Error("API URL is not configured. Please set VITE_API_BASE_URL.");
      }
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Login failed');
      }
      const data = await res.json();
      setMessage(`Welcome, ${data.username}! Login was successful.`);
      setIsLoggedIn(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6">Engineering Studio (Vite)</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-sm">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2 mt-1 bg-gray-700 rounded-md border border-gray-600"/>
            </div>
            <div>
              <label className="text-sm">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 mt-1 bg-gray-700 rounded-md border border-gray-600"/>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="p-3 bg-blue-600 rounded-md hover:bg-blue-700 mt-2">Sign In</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="mt-4 text-green-400">{message}</p>
    </main>
  );
}

export default App;
