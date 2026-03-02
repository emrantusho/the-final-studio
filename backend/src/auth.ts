import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { z } from 'zod';
import type { Env } from './index';
import { authMiddleware } from './middleware';

const LoginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

export const authApp = new Hono<Env>();

authApp.post('/login', zValidator('json', LoginSchema), async (c) => {
    const { username, password } = c.req.valid('json');
    
    const user = await c.env.DB.prepare('SELECT id, username FROM users WHERE username = ? AND password_hash = ?')
        .bind(username, password)
        .first<{id: number, username: string}>();

    if (!user) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    const sessionId = crypto.randomUUID();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    if (!c.env.SESSION_SECRET) {
        return c.json({ error: 'Session secret not configured' }, 500);
    }

    await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
        .bind(sessionId, user.id, expires.toISOString())
        .run();
    
    // --- THE DEFINITIVE FIX IS HERE ---
    // We dynamically determine the top-level domain for the cookie.
    const origin = c.req.header('Origin');
    let cookieDomain: string | undefined = undefined;
    if (origin) {
        const hostname = new URL(origin).hostname;
        // For localhost, don't set a domain. For others, set the parent domain.
        if (hostname !== 'localhost') {
            cookieDomain = hostname.split('.').slice(-2).join('.');
        }
    }
    
    setCookie(c, 'auth_session', sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/',
        expires,
        domain: cookieDomain, // Explicitly set the domain
    });
    
    return c.json({ id: user.id, username: user.username });
});

authApp.post('/logout', async (c) => {
    const sessionId = getCookie(c, 'auth_session');
    if (sessionId) {
        await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    }
    // Also clear the cookie with the domain set
    const origin = c.req.header('Origin');
    let cookieDomain: string | undefined = undefined;
    if (origin) {
        const hostname = new URL(origin).hostname;
        if (hostname !== 'localhost') {
            cookieDomain = hostname.split('.').slice(-2).join('.');
        }
    }
    deleteCookie(c, 'auth_session', { path: '/', domain: cookieDomain });
    return c.json({ message: 'Logged out' });
});

// This route now correctly uses the imported authMiddleware
authApp.get('/session', authMiddleware, async (c) => {
    const user = c.get('user');
    return c.json({ user });
});
