import { createMiddleware } from 'hono/factory';
import { getCookie, deleteCookie } from 'hono/cookie';
import type { Env } from './index';
export const authMiddleware = createMiddleware<Env>(async (c, next) => {
    const sessionId = getCookie(c, 'auth_session'); if (!sessionId) { return c.json({ error: 'Unauthorized: No session cookie' }, 401); }
    const { results } = await c.env.DB.prepare(`SELECT s.user_id, u.username FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > ?`).bind(sessionId, new Date().toISOString()).all();
    if (results.length === 0) { deleteCookie(c, 'auth_session', { path: '/' }); return c.json({ error: 'Unauthorized: Invalid or expired session' }, 401); }
    const session = results[0] as { user_id: number, username: string }; c.set('user', { id: session.user_id, username: session.username }); await next();
});
