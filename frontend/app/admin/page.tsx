"use client";
import { useEffect, useState, ReactNode } from 'react';
import { toast } from "sonner";
import { useApi } from '@/lib/api';
import Link from 'next/link';

// Define the types for our state
type Settings = { [key: string]: string };
const KEY_PROVIDERS = ['SESSION_SECRET', 'TURNSTILE_SECRET_KEY', 'GITHUB_TOKEN', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'DEEPSEEK_API_KEY'];

export default function AdminPage() {
    const [settings, setSettings] = useState<Settings>({});
    const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({});
    const [keysPresent, setKeysPresent] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const api = useApi();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [settingsData, keysData] = await Promise.all([
                    api.get<Settings>('/admin/settings'),
                    api.get<string[]>('/admin/keys')
                ]);
                setSettings(settingsData);
                setKeysPresent(keysData);
            } catch (error) { toast.error("Failed to load initial admin data."); }
            finally { setIsLoading(false); }
        };
        fetchData();
    }, [api]);
    
    const handleApiKeySave = async (provider_id: string) => {
        const api_key = apiKeys[provider_id] || '';
        try {
            await api.put('/admin/keys', { provider_id, api_key });
            toast.success(`API Key for ${provider_id} saved.`);
            if (api_key) { setKeysPresent(prev => [...new Set([...prev, provider_id])]); }
            else { setKeysPresent(prev => prev.filter(k => k !== provider_id)); }
            setApiKeys(prev => ({ ...prev, [provider_id]: '' }));
        } catch (error: any) { toast.error(`Failed to save key: ${error.message}`); }
    };
    
    const handleSettingChange = async (key: string, value: string | boolean) => {
        const stringValue = String(value);
        try {
            await api.put('/admin/settings', { key, value: stringValue });
            toast.success(`Setting '${key}' updated.`);
            setSettings(prev => ({ ...prev, [key]: stringValue }));
        } catch(e: any) {
            toast.error(`Failed to update setting: ${e.message}`);
        }
    };

    if (isLoading) {
        return <div className="bg-gray-900 text-white p-8 min-h-screen flex items-center justify-center">Loading Dashboard...</div>;
    }

    return (
        <div className="p-4 sm:p-8 bg-gray-900 min-h-screen text-white">
            <div className="mb-8">
                <Link href="/" className="text-blue-400 hover:underline">← Back to Main Studio</Link>
            </div>
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* API Key Management Card */}
                <div className="lg:col-span-2 bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-white">API Key Management</h2>
                        <p className="text-sm text-gray-400 mt-1">Secrets are encrypted at rest. Set them here.</p>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {KEY_PROVIDERS.map(provider => (
                                <div key={provider}>
                                    <label htmlFor={`key-${provider}`} className="block mb-2 text-sm font-medium text-gray-300">{provider.replace(/_/g, ' ')}</label>
                                    <div className="flex gap-2 mt-1">
                                        <input id={`key-${provider}`} type="password" value={apiKeys[provider] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKeys(prev => ({...prev, [provider]: e.target.value}))} placeholder={keysPresent.includes(provider) ? '•••••••••••••••• (Saved)' : 'Enter key...'} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500" />
                                        <button onClick={() => handleApiKeySave(provider)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition">Save</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Settings Card */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-white">Feature Flags & Settings</h2>
                        <p className="text-sm text-gray-400 mt-1">Control application behavior.</p>
                    </div>
                    <div className="p-6 pt-0 space-y-6">
                        <div className="flex items-center justify-between">
                            <label htmlFor="auto-dev-mode" className="flex flex-col space-y-1">
                                <span className="font-medium text-gray-300">Auto-Dev Mode</span>
                                <span className="text-xs text-gray-400">Allow AI to edit GitHub repo.</span>
                            </label>
                            <button onClick={() => handleSettingChange('auto_dev_mode', !(settings.auto_dev_mode === 'true'))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.auto_dev_mode === 'true' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.auto_dev_mode === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div>
                            <label htmlFor="github-repo" className="block mb-2 text-sm font-medium text-gray-300">GitHub Repository URL</label>
                            <input id="github-repo" defaultValue={settings.github_repo_url || ''} onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleSettingChange('github_repo_url', e.target.value)} placeholder="user/repo" className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
