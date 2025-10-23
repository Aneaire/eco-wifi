import { Hono } from 'hono';
import { databaseService } from '../database.js';

const app = new Hono();

// Get user session info
app.get('/session/:macAddress', async (c) => {
  try {
    const macAddress = c.req.param('macAddress');

    const user = await databaseService.findActiveUser(macAddress);

    if (!user) {
      return c.json({ error: 'No active session found' }, 404);
    }

    return c.json(user);
  } catch (error) {
    console.error('Session fetch error:', error);
    return c.json({ error: 'Failed to fetch session' }, 500);
  }
});

// Extend session (for multiple bottles)
app.post('/extend', async (c) => {
  try {
    const { macAddress } = await c.req.json();

    const success = await databaseService.extendUserSession(macAddress);

    if (!success) {
      return c.json({ error: 'User not found or session expired' }, 404);
    }

    return c.json({ success: true, message: 'Session extended by 5 minutes' });
  } catch (error) {
    console.error('Session extend error:', error);
    return c.json({ error: 'Failed to extend session' }, 500);
  }
});

// Get all active sessions
app.get('/active', async (c) => {
  try {
    const activeUsers = await databaseService.getActiveUsers();
    
    const sortedUsers = activeUsers
      .sort((a, b) => new Date(b.sessionEnd).getTime() - new Date(a.sessionEnd).getTime())
      .map(({ macAddress, sessionStart, sessionEnd, bottlesDeposited }) => ({
        mac_address: macAddress,
        session_start: sessionStart,
        session_end: sessionEnd,
        bottles_deposited: bottlesDeposited
      }));
    
    return c.json(sortedUsers);
  } catch (error) {
    console.error('Active users fetch error:', error);
    return c.json({ error: 'Failed to fetch active users' }, 500);
  }
});

// Expire old sessions (cleanup) - Note: This is now handled automatically by queries
app.post('/cleanup', async (c) => {
  try {
    // In the new architecture, expired sessions are filtered out by queries
    // This endpoint is kept for compatibility but doesn't need to do anything
    return c.json({ expired: 0, message: 'Cleanup handled automatically by queries' });
  } catch (error) {
    console.error('Cleanup error:', error);
    return c.json({ error: 'Failed to cleanup sessions' }, 500);
  }
});

export { app as userRoutes };