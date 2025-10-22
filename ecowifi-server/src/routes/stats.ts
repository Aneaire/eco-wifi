import { Hono } from 'hono';
import { db } from '../database';

const app = new Hono();

// Get system statistics dashboard
app.get('/dashboard', async (c) => {
  try {
    const today = db.getTodayStats() || { total_bottles: 0, total_sessions: 0, co2_saved: 0 };
    const totalBottles = db.getTotalBottleCount();
    const activeSessions = db.getActiveUsers().length;
    const totalUsers = db.getDistinctUserCount();

    return c.json({
      today,
      totalBottles,
      activeSessions,
      totalUsers
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return c.json({ error: 'Failed to fetch dashboard stats' }, 500);
  }
});

// Get historical stats
app.get('/history/:days', async (c) => {
  try {
    const days = parseInt(c.req.param('days')) || 7;
    const history = db.getStatsHistory(days);
    return c.json(history);
  } catch (error) {
    console.error('History fetch error:', error);
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
});

// Get real-time metrics
app.get('/realtime', async (c) => {
  try {
    const bottlesLastHour = db.getBottlesInLastHour();
    const activeNow = db.getActiveUsers().length;
    const todayTotal = db.getTodayTotalBottles();

    return c.json({
      bottlesLastHour,
      activeNow,
      todayTotal,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Realtime metrics fetch error:', error);
    return c.json({ error: 'Failed to fetch realtime metrics' }, 500);
  }
});

// Reset daily stats (for testing)
app.post('/reset-today', async (c) => {
  try {
    db.resetTodayStats();
    return c.json({ success: true, message: 'Today\'s stats reset' });
  } catch (error) {
    console.error('Reset stats error:', error);
    return c.json({ error: 'Failed to reset stats' }, 500);
  }
});

export { app as statsRoutes };