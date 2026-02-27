import { z } from 'zod';
export const LoginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });
export const KeyUpdateSchema = z.object({ provider_id: z.string(), api_key: z.string() });
export const SettingsUpdateSchema = z.object({ key: z.string(), value: z.string() });
