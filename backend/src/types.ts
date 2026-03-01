import { z } from 'zod';
// Auth
export const LoginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });
// Admin
export const SettingsUpdateSchema = z.object({ key: z.string(), value: z.string() });
export const KeyUpdateSchema = z.object({ provider_id: z.string(), api_key: z.string() });
// Chat
export const PostMessageSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string()
    }))
});
