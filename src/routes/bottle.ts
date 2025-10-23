import { Hono } from 'hono';
import { databaseService } from '../database.js';

const app = new Hono();

// Record plastic deposit and grant WiFi access
app.post('/deposit', async (c) => {
  try {
    const { macAddress } = await c.req.json();

    // Log plastic deposit
    const bottleLog = await databaseService.addBottleLog(macAddress);

    // Check for existing active session
    const existingSession = await databaseService.findActiveUser(macAddress);

    let sessionResult;
    
    if (existingSession) {
      // Extend existing session
      const success = await databaseService.extendUserSession(macAddress);
      console.log(`📶 Extended session for ${macAddress}: ${existingSession.sessionEnd} → +5 minutes`);
      sessionResult = { success };
    } else {
      // Create new session
      const newUser = await databaseService.createUser(macAddress);
      console.log(`🆕 Created new session for ${macAddress}: 15 minutes`);
      sessionResult = { success: true, userId: newUser.id };
    }

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
    const history = await databaseService.getBottleHistory(100);
    return c.json(history);
  } catch (error) {
    console.error('History fetch error:', error);
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
});

// Get bottle status for polling
app.get('/status', async (c) => {
  try {
    const count = await databaseService.getRecentBottleCount(30);
    return c.json({ bottleDetected: count > 0 });
  } catch (error) {
    console.error('Status fetch error:', error);
    return c.json({ error: 'Failed to fetch status' }, 500);
  }
});

async function grantWifiAccess(macAddress: string) {
  // Mikrotik SSH implementation - working method
  console.log(`📶 Granting WiFi access to MAC: ${macAddress}`);
  
  try {
    // Use SSH to execute Mikrotik command
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    const sshCommand = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${process.env.MIKROTIK_USER}@${process.env.MIKROTIK_HOST} '/ip hotspot user add name="${macAddress}" password="recyfi2024" profile="${process.env.MIKROTIK_PROFILE}" comment="RecyFi plastic deposit"'`;
    
    const { stdout, stderr } = await execAsync(sshCommand);
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error(`❌ SSH error: ${stderr}`);
      return false;
    }
    
    console.log(`✅ Successfully created hotspot user for ${macAddress}`);
    return true;
  } catch (error) {
    console.error('Failed to grant WiFi access:', error);
    return false;
  }
}

export { app as bottleRoutes };