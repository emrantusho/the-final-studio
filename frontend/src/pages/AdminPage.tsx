import { Link } from 'react-router-dom';
// This is a placeholder. You would add the full API key management UI here.
export default function AdminPage() {
    return (
        <div className="p-8 bg-gray-900 min-h-screen text-white">
             <div className="mb-8"> <Link to="/" className="text-blue-400 hover:underline">← Back to Studio</Link> </div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="mt-4">The full API Key and Password Management UI will be built here.</p>
        </div>
    );
}
