import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from './index';
import { PostMessageSchema } from './types';

export const chatApp = new Hono<Env>();

// This is a simple, non-streaming endpoint for now.
// It takes a message and uses Workers AI to get a response.
chatApp.post('/message', zValidator('json', PostMessageSchema), async (c) => {
    const { content } = c.req.valid('json');

    const aiResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
            { role: 'system', content: 'You are an expert full-stack engineer and Cloudflare architect.' },
            { role: 'user', content: content }
        ]
    });

    return c.json(aiResponse);
});
