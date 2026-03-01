import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authApp } from './auth';
import { adminApp } from './admin';
import { authMiddleware } from './middleware';

export type Env = { Bindings: { DB: D1Database; R2_BUCKET: R2Bucket; VECTORIZE_INDEX: VectorizeIndex; AI: Ai; SESSION_SECRET: string; TURNSTILE_SECRET_KEY: string; GITHUB_TOKEN: string; }; Variables: { user: { id: number; username: string; }; }; };
const app = new Hono<Env>();

app.use('*', logger());
// THE CRUCIAL FIX: This CORS configuration is required for cookies.
app.use('*', cors({
  origin: (origin) => {
    // In production, you would lock this down to your specific frontend URL
    // For now, this allows any origin from your pages.dev domain.
    if (origin.endsWith('.pages.dev') || origin === 'http://localhost:3000') {
      return origin;
    }
    return 'https://your-production-domain.com'; // Return a default or deny
  },
  allowHeaders: ['Content-Type'],
  allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // This is ESSENTIAL for cookies to be sent and received
}));

app.get('/', (c) => c.json({ status: 'ok', message: 'Backend is live!' }));

// API Routes
app.route('/auth', authApp);
app.use('/admin/*', authMiddleware);
app.route('/admin', adminApp);

export default app;
