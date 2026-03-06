import React, { useState } from 'react';
import { useAuth } from '../lib/Auth';
import { Link, useNavigate } from 'react-router-dom';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../lib/api';

interface Message { role: 'user' | 'assistant'; content: string; }

function ChatPanel() {
    const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Welcome to the Engineering Studio. How can I assist you?' }]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;
        setIsStreaming(true);
        const newMessages: Message[] = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        
        const assistantResponse: Message = { role: 'assistant', content: '' };
        setMessages(prev => [...prev, assistantResponse]);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` },
                body: JSON.stringify({ messages: newMessages.slice(-10) }) // Send last 10 messages for context
            });
            if (!response.body) throw new Error("No response body");
            const reader = response.body.getReader(); const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read(); if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    lastMsg.content += chunk;
                    return [...prev.slice(0, -1), lastMsg];
                });
            }
        } catch (error) { console.error("Streaming failed:", error); } 
        finally { setIsStreaming(false); }
    };

    return (
        <div className="flex flex-col h-full bg-gray-800/50">
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg, i) => (
                    <div key={i} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-gray-600">
                <form onSubmit={handleSendMessage} className="relative">
                    <textarea value={input} onChange={e => setInput(e.target.value)} disabled={isStreaming} placeholder="Ask the AI..." className="w-full bg-gray-700 p-3 rounded-md pr-24 text-white" />
                    <button type="submit" disabled={isStreaming} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-md">Send</button>
                </form>
            </div>
        </div>
    );
}

export default function StudioPage() {
    const { user, logout } = useAuth();
    return (
        <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
            <header className="flex items-center justify-between p-2 border-b border-gray-700 shrink-0">
                <h1 className="text-lg font-bold">Engineering Studio</h1>
                <div className="flex items-center gap-4">
                    <span>{user?.username}</span>
                    <Link to="/admin" className="text-sm text-blue-400 hover:underline">Admin</Link>
                    <button onClick={logout} className="px-3 py-1 bg-red-600 text-sm rounded-md">Log Out</button>
                </div>
            </header>
            <ResizablePanelGroup direction="horizontal" className="flex-1">
                <ResizablePanel defaultSize={20} className="p-4"><p>Sidebar / File Tree</p></ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={80}>
                    <ResizablePanelGroup direction="vertical">
                        <ResizablePanel defaultSize={75}><ChatPanel /></ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={25} className="p-4"><p>Terminal / Output</p></ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
