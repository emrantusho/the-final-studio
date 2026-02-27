"use client";
import { useEffect, useState, ReactNode } from 'react';
import { toast } from "sonner";
import { useApi } from '@/lib/api';

// --- CORRECTED PLACEHOLDER COMPONENTS ---
// They now all accept a className prop.
const Card = ({ children, className }: { children: ReactNode, className?: string }) => <div className={`bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg ${className}`}>{children}</div>;
const CardHeader = ({ children }: { children: ReactNode }) => <div className="p-6">{children}</div>;
const CardTitle = ({ children }: { children: ReactNode }) => <h2 className="text-xl font-bold text-white">{children}</h2>;
const CardDescription = ({ children }: { children: ReactNode }) => <p className="text-sm text-gray-400 mt-1">{children}</p>;
const CardContent = ({ children, className }: { children: ReactNode, className?: string }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
const Label = ({ children, ...props }: any) => <label className="block mb-2 text-sm font-medium text-gray-300" {...props}>{children}</label>;
const Input = (props: any) => <input className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500" {...props} />;
const Button = ({ children, ...props }: any) => <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition" {...props}>{children}</button>;
const Switch = ({ checked, onCheckedChange, ...props }: any) => <button onClick={() => onCheckedChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-600'}`} {...props}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} /></button>;

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
            if (api_key !== '') { setKeysPresent(prev => [...new Set([...prev, provider_id])]); setApiKeys(prev => ({ ...prev, [provider_id]: '' })); }
            else { setKeysPresent(prev => prev.filter(k => k !== provider_id)); }
        } catch (error: any) { toast.error(`Failed to save key: ${error.message}`); }
    };
    
    const handleSettingChange = async (key: string, value: string | boolean) => {
        const stringValue = String(value);
        await api.put('/admin/settings', { key, value: stringValue });
        toast.success(`Setting '${key}' updated.`);
        setSettings(prev => ({ ...prev, [key]: stringValue }));
    };

    if (isLoading) return <div className="text-white p-8">Loading settings...</div>;

    return (
        <div className="p-4 sm:p-8 bg-gray-900 min-h-screen text-white">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>API Key Management</CardTitle>
                        <CardDescription>Secrets are encrypted at rest on the backend. Leave a key blank and click Save to delete it.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {KEY_PROVIDERS.map(provider => (
                                <div key={provider}>
                                    <Label htmlFor={`key-${provider}`}>{provider.replace(/_/g, ' ')}</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input id={`key-${provider}`} type="password" value={apiKeys[provider] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKeys(prev => ({...prev, [provider]: e.target.value}))} placeholder={keysPresent.includes(provider) ? '•••••••••••••••• (Saved)' : 'Enter key...'} />
                                        <Button onClick={() => handleApiKeySave(provider)}>Save</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Feature Flags & Settings</CardTitle>
                        <CardDescription>Control application behavior.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700/50">
                            <Label htmlFor="auto-dev-mode">Auto-Dev Mode</Label>
                            <Switch id="auto-dev-mode" checked={settings.auto_dev_mode === 'true'} onCheckedChange={(c: boolean) => handleSettingChange('auto_dev_mode', c)} />
                        </div>
                         <div>
                            <Label htmlFor="github-repo">GitHub Repository URL</Label>
                            <Input id="github-repo" value={settings.github_repo_url || ''} onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleSettingChange('github_repo_url', e.target.value)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings(s => ({...s, github_repo_url: e.target.value}))} placeholder="user/repo" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
