// Database migration script using Bun SQL
import { Database } from 'bun:sqlite';

const db = new Database('ecowifi.db', { create: true });

console.log('🚀 Running database migrations...');

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mac_address TEXT UNIQUE NOT NULL,
    session_start DATETIME,
    session_end DATETIME,
    bottles_deposited INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired'))
  );
`);

// Create bottle_logs table
db.exec(`
  CREATE TABLE IF NOT EXISTS bottle_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    weight REAL,
    size REAL,
    material_confirmed BOOLEAN DEFAULT FALSE,
    mac_address TEXT
  );
`);

// Create system_stats table
db.exec(`
  CREATE TABLE IF NOT EXISTS system_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE UNIQUE NOT NULL,
    total_bottles INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    co2_saved REAL DEFAULT 0.0
  );
`);

// Create indexes for better performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_mac ON users(mac_address);
  CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  CREATE INDEX IF NOT EXISTS idx_bottle_logs_timestamp ON bottle_logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_system_stats_date ON system_stats(date);
`);

// Insert initial system stats for today if not exists
const insertToday = db.prepare(`
  INSERT OR IGNORE INTO system_stats (date, total_bottles, total_sessions, co2_saved)
  VALUES (date('now'), 0, 0, 0.0)
`);

insertToday.run();

console.log('✅ Database migrations completed successfully!');
console.log('📊 Database schema ready for EcoWiFi operations.');