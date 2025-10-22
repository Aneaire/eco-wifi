import { Hono } from 'hono';
import { db } from '../database';

const app = new Hono();

// Get user session info
app.get('/session/:macAddress', async (c) => {
  try {
    const macAddress = c.req.param('macAddress');

    const user = db.findActiveUser(macAddress);

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

    const success = db.extendUserSession(macAddress);

    if (!success) {
      return c.json({ error: 'User not found or session expired' }, 404);
    }

    return c.json({ success: true, message: 'Session extended by 15 minutes' });
  } catch (error) {
    console.error('Session extend error:', error);
    return c.json({ error: 'Failed to extend session' }, 500);
  }
});

// Get all active sessions
app.get('/active', async (c) => {
  try {
    const activeUsers = db.getActiveUsers()
      .sort((a, b) => new Date(b.session_end).getTime() - new Date(a.session_end).getTime())
      .map(({ mac_address, session_start, session_end, bottles_deposited }) => ({
        mac_address,
        session_start,
        session_end,
        bottles_deposited
      }));
    return c.json(activeUsers);
  } catch (error) {
    console.error('Active users fetch error:', error);
    return c.json({ error: 'Failed to fetch active users' }, 500);
  }
});

// Expire old sessions (cleanup)
app.post('/cleanup', async (c) => {
  try {
    const expiredCount = db.cleanupExpiredSessions();
    return c.json({ expired: expiredCount });
  } catch (error) {
    console.error('Cleanup error:', error);
    return c.json({ error: 'Failed to cleanup sessions' }, 500);
  }
});

export { app as userRoutes };