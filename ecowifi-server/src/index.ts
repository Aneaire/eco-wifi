import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';

// Import routes and database
import { bottleRoutes } from './routes/bottle';
import { userRoutes } from './routes/user';
import { statsRoutes } from './routes/stats';
import { db } from './database';

// Initialize in-memory database
console.log('In-memory database initialized');

const app = new Hono();

// Middleware
app.use('/*', cors());
app.use('/static/*', serveStatic({ root: './public' }));
app.use('/image/*', serveStatic({ root: './' }));
app.use('/deposit.html', serveStatic({ root: './public' }));
app.use('/', serveStatic({ root: './public', rewriteRequestPath: (path) => path === '/' ? '/index.html' : path }));

// Routes
app.route('/api/bottle', bottleRoutes);
app.route('/api/user', userRoutes);
app.route('/api/stats', statsRoutes);

// WebSocket endpoint for real-time updates
app.get('/ws', async (c) => {
  // WebSocket implementation will be added
  return c.text('WebSocket endpoint - coming soon');
});

// Legacy captive portal redirect
app.get('/portal', (c) => {
  return c.redirect('/');
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const port = 9999;

serve({
  fetch: app.fetch,
  port,
});

console.log(`🚀 RecyFi server is running on port ${port}`);