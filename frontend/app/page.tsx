"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { useVirtualizer } from '@tanstack/react-virtual';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApi } from '@/lib/api';

const Button = ({ children, ...props }: any) => <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition disabled:opacity-50" {...props}>{children}</button>;
const Textarea = React.forwardRef<HTMLTextAreaElement, any>((props, ref) => <textarea ref={ref} className="w-full resize-none bg-gray-700 border-gray-600 rounded-lg p-3 pr-24 text-white" {...props} />);
Textarea.displayName = "Textarea";
interface Message { id: string; role: 'user' | 'assistant'; content: string; }

function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: 'Hello! I am your AI engineering assistant, connected live to Cloudflare Workers AI. How can I help you?' }
    ]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const api = useApi();
    const parentRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const rowVirtualizer = useVirtualizer({ count: messages.length, getScrollElement: () => parentRef.current, estimateSize: useCallback(() => 100, []), overscan: 5 });
    useEffect(() => { if (messages.length > 0) rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end', behavior: 'smooth' }); }, [messages, rowVirtualizer]);
    useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; const scrollHeight = textareaRef.current.scrollHeight; textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`; } }, [input]);

    const handleSendMessage = async () => {
        if (!input.trim() || isStreaming) return;
        setIsStreaming(true);
        const newUserMessage: Message = { id: crypto.randomUUID(), role: 'user', content: input };
        const currentMessages = [...messages, newUserMessage];
        setMessages(currentMessages);
        setInput('');

        const assistantMessageId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: currentMessages.slice(-10).map(({ role, content }) => ({ role, content })) // Send last 10 messages for context
                })
            });

            if (!response.body) throw new Error("No response body");
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: msg.content + chunk }
                            : msg
                    )
                );
            }
        } catch (error) {
            console.error("Streaming failed:", error);
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: "Sorry, I encountered an error. Please check the backend logs." }
                        : msg
                )
            );
        } finally {
            setIsStreaming(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };

    return (
        <div className="flex flex-col h-full bg-gray-800 rounded-lg border border-gray-700">
            <div ref={parentRef} className="flex-1 overflow-y-auto p-4 space-y-6">
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                    {rowVirtualizer.getVirtualItems().map(virtualItem => {
                        const message = messages[virtualItem.index]; const isUser = message.role === 'user';
                        return (
                            <div key={message.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualItem.start}px)`, padding: '8px 0', }} className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`} >
                                <div className={`max-w-2xl rounded-lg p-3 text-sm ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                                    <ReactMarkdown components={{ div: ({node, ...props}) => <div className="prose prose-sm prose-invert max-w-none" {...props} /> }} remarkPlugins={[remarkGfm]}>
                                        {message.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                <div className="relative">
                    <Textarea ref={textareaRef} value={input} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={isStreaming ? "AI is thinking..." : "Ask the Engineering Studio..."} rows={1} disabled={isStreaming}/>
                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                        <Button onClick={handleSendMessage} disabled={!input.trim() || isStreaming}>Send</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MainPage() {
  const { user, isLoading, logout } = useAuth(); const router = useRouter();
  useEffect(() => { if (!isLoading && !user) { router.replace('/login'); } }, [isLoading, user, router]);
  if (isLoading || !user) { return ( <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">Loading Studio...</div> ); }
  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
        <h1 className="text-xl font-bold">Engineering Studio</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {user.username}</span>
          <Link href="/admin" className="text-sm text-blue-400 hover:underline">Admin Dashboard</Link>
          <button onClick={logout} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition">Log Out</button>
        </div>
      </header>
      <main className="p-4 sm:p-8 flex-1 flex flex-col">
        <ChatInterface />
      </main>
    </div>
  );
}
