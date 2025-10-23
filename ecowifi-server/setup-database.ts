import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_TOKEN!,
});

const sql = `
CREATE TABLE IF NOT EXISTS bottles (
	id integer PRIMARY KEY NOT NULL,
	timestamp text NOT NULL,
	material_confirmed integer DEFAULT false,
	mac_address text NOT NULL
);

CREATE TABLE IF NOT EXISTS stats (
	id integer PRIMARY KEY NOT NULL,
	date text NOT NULL,
	total_bottles integer DEFAULT 0,
	total_sessions integer DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS stats_date_unique ON stats (date);

CREATE TABLE IF NOT EXISTS users (
	id integer PRIMARY KEY NOT NULL,
	mac_address text NOT NULL,
	session_start text,
	session_end text,
	bottles_deposited integer DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS users_mac_address_unique ON users (mac_address);
`;

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database tables...');
    
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await client.execute(statement.trim());
        console.log('✅ Executed:', statement.trim().substring(0, 50) + '...');
      }
    }
    
    console.log('🎉 Database setup completed!');
    
    // Test the connection
    const result = await client.execute('SELECT COUNT(*) as count FROM users');
    console.log('📊 Users table count:', result.rows[0].count);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();