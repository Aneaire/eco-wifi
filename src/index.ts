import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';

// Import routes
import { bottleRoutes } from './routes/bottle.js';
import { userRoutes } from './routes/user.js';
import { statsRoutes } from './routes/stats.js';

const app = new Hono();

// Middleware - CORS configured for Mikrotik access
app.use('/*', cors({
  origin: '*', // Allow all origins for Mikrotik hotspot access
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

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
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    architecture: 'hybrid-mikrotik-render'
  });
});

const port = parseInt(process.env.PORT || '3000');

serve({
  fetch: app.fetch,
  port,
});

console.log(`🚀 RecyFi API server is running on port ${port}`);
console.log(`📊 Architecture: Hybrid (Mikrotik frontend + Render backend)`);
console.log(`🗄️  Database: Turso SQLite with Drizzle ORM`);