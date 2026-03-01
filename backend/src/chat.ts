import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { stream } from 'hono/streaming';
import type { Env } from './index';
import { PostMessageSchema } from './types';

export const chatApp = new Hono<Env>();

chatApp.post('/stream', zValidator('json', PostMessageSchema), async (c) => {
    const { messages } = c.req.valid('json');

    const streamResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: messages,
        stream: true,
    });
    
    // The stream() helper from Hono makes this incredibly easy
    return stream(c, async (s) => {
        const reader = streamResponse.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            
            const chunk = decoder.decode(value);
            // The AI stream sends data in a specific format, we need to parse it
            for (const line of chunk.split('\n')) {
                if (line.startsWith('data: ')) {
                    const data = line.substring(6);
                    if (data.trim() === '[DONE]') {
                        break;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.response) {
                            await s.write(parsed.response);
                        }
                    } catch (e) {
                        console.error("Could not parse stream chunk:", data);
                    }
                }
            }
        }
    });
});
