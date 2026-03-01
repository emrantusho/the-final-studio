import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authApp } from './auth';
import { adminApp } from './admin';
import { chatApp } from './chat';
// import { githubApp } from './github';
// import { ragApp } from './rag';
import { authMiddleware } from './middleware';

export type Env = { Bindings: { DB: D1Database; R2_BUCKET: R2Bucket; VECTORIZE_INDEX: VectorizeIndex; AI: Ai; SESSION_SECRET: string; TURNSTILE_SECRET_KEY: string; GITHUB_TOKEN: string; }; Variables: { user: { id: number; username: string; }; }; };
const app = new Hono<Env>();

app.use('*', logger());
app.use('*', cors({
  origin: (origin) => {
    if (origin.endsWith('.pages.dev') || origin === 'http://localhost:3000') {
      return origin;
    }
    return 'https://your-production-domain.com';
  },
  allowHeaders: ['Content-Type'],
  allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.get('/', (c) => c.json({ status: 'ok', message: 'Backend is live!' }));

// API Routes
app.route('/auth', authApp);

app.use('/admin/*', authMiddleware);
app.route('/admin', adminApp);

app.use('/chat/*', authMiddleware);
app.route('/chat', chatApp);

export default app;
