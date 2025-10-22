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

// Routes
app.route('/api/bottle', bottleRoutes);
app.route('/api/user', userRoutes);
app.route('/api/stats', statsRoutes);

// WebSocket endpoint for real-time updates
app.get('/ws', async (c) => {
  // WebSocket implementation will be added
  return c.text('WebSocket endpoint - coming soon');
});

// Serve captive portal
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>EcoWiFi Access</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/htmx.org@1.9.10"></script>
      </head>
      <body class="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
        <div class="container mx-auto px-4 py-8">
          <div class="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
            <div class="text-center mb-6">
              <i class="fas fa-recycle text-6xl text-green-500 mb-4"></i>
              <h1 class="text-2xl font-bold text-gray-800">EcoWiFi Access</h1>
              <p class="text-gray-600">Insert a plastic bottle for 15 minutes free WiFi</p>
            </div>
            <div id="status" class="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4 mb-6">
              <div class="flex items-center">
                <i class="fas fa-info-circle text-yellow-600 mr-2"></i>
                <span id="status-text">Waiting for bottle...</span>
              </div>
            </div>
            <div id="timer" class="hidden text-center mb-6">
              <div class="text-3xl font-bold text-green-600">
                <span id="minutes">15</span>:<span id="seconds">00</span>
              </div>
              <p class="text-gray-600">Time Remaining</p>
            </div>
            <div class="text-center text-sm text-gray-500">
              <p>Environmental Impact</p>
              <div class="flex justify-center space-x-4 mt-2">
                <span><i class="fas fa-bottle-water"></i> <span id="bottle-count">0</span> bottles</span>
                <span><i class="fas fa-leaf"></i> <span id="co2-saved">0</span> kg CO₂</span>
              </div>
            </div>
          </div>
        </div>
        <script src="/static/js/portal.js"></script>
      </body>
    </html>
  `);
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

console.log(`🚀 EcoWiFi server is running on port ${port}`);