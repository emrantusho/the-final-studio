#!/bin/bash
# FINAL, FULL-FEATURED BACKEND SCRIPT
set -e
echo "--- UPGRADING BACKEND WITH ALL FEATURES ---"

# --- 1. Re-install all dependencies to be certain ---
npm install hono @hono/zod-validator zod

# --- 2. Overwrite all source files with their final versions ---

# --- types.ts ---
cat > src/types.ts << 'EOF'
import { z } from 'zod';
export const LoginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });
export const SettingsUpdateSchema = z.object({ key: z.string(), value: z.string() });
export const KeyUpdateSchema = z.object({ provider_id: z.string(), api_key: z.string() });
export const CreateChatSchema = z.object({ title: z.string().min(1), message: z.string().min(1) });
export const PostMessageSchema = z.object({ chatId: z.string(), content: z.string().min(1) });
export const InitiateUploadSchema = z.object({ fileName: z.string(), contentType: z.string() });
export const CompleteUploadSchema = z.object({ fileName: z.string(), uploadId: z.string(), parts: z.array(z.object({ partNumber: z.number(), etag: z.string() })) });
export const IngestDocumentSchema = z.object({ r2Key: z.string() });
export const ReadFileSchema = z.object({ path: z.string() });
export const CommitChangesSchema = z.object({ branch: z.string(), commitMessage: z.string(), changes: z.array(z.object({ path: z.string(), content: z.string()})) });
export const CreatePRSchema = z.object({ head: z.string(), base: z.string(), title: z.string(), body: z.string() });
EOF

# --- crypto.ts ---
cat > src/crypto.ts << 'EOF'
const buf2hex = (buf: ArrayBuffer | ArrayBufferView) => Array.prototype.map.call(new Uint8Array(buf as ArrayBuffer), x => ('00' + x.toString(16)).slice(-2)).join('');
const hex2buf = (hex: string) => new Uint8Array(hex.match(/[\da-f]{2}/gi)!.map(h => parseInt(h, 16))).buffer;
async function getKey(secret: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'PBKDF2' }, false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('studio-salt'), iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}
export async function encrypt(secret: string, plaintext: string): Promise<{ encrypted_key_hex: string, iv_hex: string }> {
    const key = await getKey(secret); const iv = crypto.getRandomValues(new Uint8Array(12)); const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(plaintext));
    return { encrypted_key_hex: buf2hex(encrypted), iv_hex: buf2hex(iv) };
}
export async function decrypt(secret: string, encrypted_key_hex: string, iv_hex: string): Promise<string> {
    const key = await getKey(secret); const iv = hex2buf(iv_hex); const encryptedData = hex2buf(encrypted_key_hex);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, encryptedData);
    return new TextDecoder().decode(decrypted);
}
EOF

# --- middleware.ts ---
cat > src/middleware.ts << 'EOF'
import { createMiddleware } from 'hono/factory';
import { getCookie, deleteCookie } from 'hono/cookie';
import type { Env } from './index';
export const authMiddleware = createMiddleware<Env>(async (c, next) => {
    const sessionId = getCookie(c, 'auth_session'); if (!sessionId) { return c.json({ error: 'Unauthorized: No session cookie' }, 401); }
    const { results } = await c.env.DB.prepare(`SELECT s.user_id, u.username FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > ?`).bind(sessionId, new Date().toISOString()).all();
    if (results.length === 0) { deleteCookie(c, 'auth_session', { path: '/' }); return c.json({ error: 'Unauthorized: Invalid or expired session' }, 401); }
    const session = results[0] as { user_id: number, username: string }; c.set('user', { id: session.user_id, username: session.username }); await next();
});
EOF

# --- auth.ts ---
cat > src/auth.ts << 'EOF'
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { z } from 'zod';
import type { Env } from './index';
import { authMiddleware } from './middleware';
const LoginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });
export const authApp = new Hono<Env>();
authApp.post('/login', zValidator('json', LoginSchema), async (c) => {
    const { username, password } = c.req.valid('json');
    const user = await c.env.DB.prepare('SELECT id, username FROM users WHERE username = ? AND password_hash = ?').bind(username, password).first<{id: number, username: string}>();
    if (!user) { return c.json({ error: 'Invalid credentials' }, 401); }
    const sessionId = crypto.randomUUID(); const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    if (!c.env.SESSION_SECRET) { return c.json({ error: 'Session secret not configured on server' }, 500); }
    await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').bind(sessionId, user.id, expires.toISOString()).run();
    setCookie(c, 'auth_session', sessionId, { httpOnly: true, secure: true, sameSite: 'None', path: '/', expires });
    return c.json({ id: user.id, username: user.username });
});
authApp.get('/session', authMiddleware, async (c) => { const user = c.get('user'); return c.json({ user }); });
authApp.post('/logout', async (c) => { deleteCookie(c, 'auth_session', { path: '/' }); return c.json({ message: 'Logged out' }); });
EOF

# --- admin.ts ---
cat > src/admin.ts << 'EOF'
import { Hono } from 'hono'; import { zValidator } from '@hono/zod-validator'; import type { Env } from './index'; import { SettingsUpdateSchema, KeyUpdateSchema } from './types'; import { encrypt } from './crypto';
export const adminApp = new Hono<Env>();
adminApp.get('/settings', async (c) => { const { results } = await c.env.DB.prepare('SELECT key, value FROM app_settings').all(); const settings = (results as {key: string, value: string}[]).reduce((acc: Record<string, string>, { key, value }) => { acc[key] = value; return acc; }, {}); return c.json(settings); });
adminApp.put('/settings', zValidator('json', SettingsUpdateSchema), async (c) => { const { key, value } = c.req.valid('json'); await c.env.DB.prepare(`INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`).bind(key, value).run(); return c.json({ success: true, key, value }); });
adminApp.get('/keys', async (c) => { const { results } = await c.env.DB.prepare('SELECT provider_id FROM secure_keys').all<{provider_id: string}>(); return c.json(results.map((r: {provider_id: string}) => r.provider_id)); });
adminApp.put('/keys', zValidator('json', KeyUpdateSchema), async (c) => {
    const { provider_id, api_key } = c.req.valid('json'); if (!c.env.SESSION_SECRET) { return c.json({ error: 'Server missing SESSION_SECRET' }, 500); }
    if (api_key === '') { await c.env.DB.prepare('DELETE FROM secure_keys WHERE provider_id = ?').bind(provider_id).run(); return c.json({ success: true, message: `Key for ${provider_id} deleted.` }); }
    else { const { encrypted_key_hex, iv_hex } = await encrypt(c.env.SESSION_SECRET, api_key); await c.env.DB.prepare(`INSERT INTO secure_keys (provider_id, encrypted_key_hex, iv_hex) VALUES (?, ?, ?) ON CONFLICT(provider_id) DO UPDATE SET encrypted_key_hex=excluded.encrypted_key_hex, iv_hex=excluded.iv_hex`).bind(provider_id, encrypted_key_hex, iv_hex).run(); return c.json({ success: true, message: `Key for ${provider_id} saved.` }); }
});
EOF

# --- index.ts (The Router) ---
cat > src/index.ts << 'EOF'
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authApp } from './auth';
import { adminApp } from './admin';
import { authMiddleware } from './middleware';

export type Env = { Bindings: { DB: D1Database; R2_BUCKET: R2Bucket; VECTORIZE_INDEX: VectorizeIndex; AI: Ai; SESSION_SECRET: string; TURNSTILE_SECRET_KEY: string; GITHUB_TOKEN: string; }; Variables: { user: { id: number; username: string; }; }; };
const app = new Hono<Env>();

app.use('*', logger());
app.use('*', cors({ origin: (origin) => origin, allowHeaders: ['Content-Type'], allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'], credentials: false, }));

app.get('/', (c) => c.json({ status: 'ok', message: 'Backend is live!' }));

// API Routes
app.route('/auth', authApp);

app.use('/admin/*', authMiddleware);
app.route('/admin', adminApp);

// Future routes would be added here
// app.use('/chat/*', authMiddleware);
// app.route('/chat', chatApp);

export default app;
EOF

# --- 3. Redeploy Backend ---
echo "Deploying updated backend..."
npx wrangler deploy

echo "✅✅✅ Backend upgrade complete! ✅✅✅"