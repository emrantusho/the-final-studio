"use client";
import { useEffect, useState } from 'react';
import { toast } from "sonner";
import { useApi } from '@/lib/api';
import Link from 'next/link';
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";

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

    if (isLoading) return <div className="bg-gray-900 text-white p-8 min-h-screen flex items-center justify-center">Loading Dashboard...</div>;

    return (
        <div className="p-4 sm:p-8 bg-gray-900 min-h-screen text-white">
            <div className="mb-8"> <Link href="/" className="text-blue-400 hover:underline">← Back to Main Studio</Link> </div>
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader> <CardTitle>API Key Management</CardTitle> <CardDescription>Secrets are encrypted at rest. Set them here instead of using wrangler.</CardDescription> </CardHeader>
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
                    <CardHeader> <CardTitle>Feature Flags & Settings</CardTitle> <CardDescription>Control application behavior.</CardDescription> </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="auto-dev-mode" className="flex flex-col space-y-1"><span>Auto-Dev Mode</span><span className="text-xs text-gray-400">Allow AI to edit GitHub repo.</span></Label>
                            <Switch id="auto-dev-mode" checked={settings.auto_dev_mode === 'true'} onCheckedChange={(c: boolean) => handleSettingChange('auto_dev_mode', c)} />
                        </div>
                         <div>
                            <Label htmlFor="github-repo">GitHub Repository URL</Label>
                            <Input id="github-repo" defaultValue={settings.github_repo_url || ''} onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleSettingChange('github_repo_url', e.target.value)} placeholder="user/repo" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
