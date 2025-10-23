import { Hono } from 'hono';
import { databaseService } from '../database.js';

const app = new Hono();

// Get system statistics dashboard
app.get('/dashboard', async (c) => {
  try {
    const today = await databaseService.getTodayStats() || { totalBottles: 0, totalSessions: 0 };
    const totalBottles = await databaseService.getTotalBottleCount();
    const activeSessions = (await databaseService.getActiveUsers()).length;
    const totalUsers = await databaseService.getDistinctUserCount();

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
    const history = await databaseService.getStatsHistory(days);
    return c.json(history);
  } catch (error) {
    console.error('History fetch error:', error);
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
});

// Get real-time metrics
app.get('/realtime', async (c) => {
  try {
    const bottlesLastHour = await databaseService.getBottlesInLastHour();
    const activeNow = (await databaseService.getActiveUsers()).length;
    const todayTotal = await databaseService.getTodayTotalBottles();

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
    await databaseService.resetTodayStats();
    return c.json({ success: true, message: 'Today\'s stats reset' });
  } catch (error) {
    console.error('Reset stats error:', error);
    return c.json({ error: 'Failed to reset stats' }, 500);
  }
});

export { app as statsRoutes };