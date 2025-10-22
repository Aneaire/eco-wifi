import { Hono } from 'hono';
import { db } from '../database';

const app = new Hono();

// Record plastic deposit and grant WiFi access
app.post('/deposit', async (c) => {
  try {
    const { macAddress } = await c.req.json();

    // Log plastic deposit
    const bottleLog = db.addBottleLog(macAddress);

    // Check for existing active session
    const existingSession = db.findActiveUser(macAddress);

    let sessionResult;
    
    if (existingSession) {
      // Extend existing session
      const success = db.extendUserSession(macAddress);
      console.log(`📶 Extended session for ${macAddress}: ${existingSession.session_end} → +5 minutes`);
      sessionResult = { success };
    } else {
      // Create new session
      const newUser = db.createUser(macAddress);
      console.log(`🆕 Created new session for ${macAddress}: 5 minutes`);
      sessionResult = { success: true, userId: newUser.id };
    }

    // Update daily stats
    db.updateTodayStats(1, 0);

    // Grant WiFi access via Mikrotik API
    await grantWifiAccess(macAddress);

    return c.json({
      success: true,
      sessionId: bottleLog.id,
      message: 'WiFi access granted for 5 minutes'
    });

  } catch (error) {
    console.error('Plastic deposit error:', error);
    return c.json({ error: 'Failed to process plastic deposit' }, 500);
  }
});

// Get bottle history
app.get('/history', async (c) => {
  try {
    const history = db.getBottleHistory(100);
    return c.json(history);
  } catch (error) {
    console.error('History fetch error:', error);
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
});

// Get bottle status for polling
app.get('/status', async (c) => {
  try {
    const count = db.getRecentBottleCount(30);
    return c.json({ bottleDetected: count > 0 });
  } catch (error) {
    console.error('Status fetch error:', error);
    return c.json({ error: 'Failed to fetch status' }, 500);
  }
});

async function grantWifiAccess(macAddress: string) {
  // Mikrotik API implementation - disabled for demo
  console.log(`📶 Granting WiFi access to MAC: ${macAddress}`);
  
  // In production, this would make the actual API call:
  /*
  try {
    const response = await fetch('http://192.168.1.1/rest/ip/hotspot/user/add', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('admin:password')
      },
      body: JSON.stringify({
        name: macAddress,
        password: 'recyfi2024',
        profile: '5min-access',
        comment: 'RecyFi plastic deposit'
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to grant WiFi access:', error);
    return false;
  }
  */
  
  return true; // Simulate success for demo
}

export { app as bottleRoutes };