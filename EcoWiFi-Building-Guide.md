# EcoWiFi System - Complete Building Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Hardware Requirements](#hardware-requirements)
3. [Software Requirements](#software-requirements)
4. [Step-by-Step Assembly](#step-by-step-assembly)
5. [Network Configuration](#network-configuration)
6. [Software Setup](#software-setup)
7. [Sensor Integration](#sensor-integration)
8. [Captive Portal Configuration](#captive-portal-configuration)
9. [Testing and Deployment](#testing-and-deployment)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

The EcoWiFi system is an IoT solution that provides 15 minutes of WiFi internet access in exchange for recycling plastic bottles. The system uses a captive portal interface that detects bottle deposits through sensors and automatically grants network access.

### Key Features
- Automated plastic bottle detection
- 15-minute WiFi access per bottle
- Real-time system monitoring
- Mobile-responsive captive portal
- Environmental impact tracking
- Secure network management

---

## Hardware Requirements

### Main Components

#### 1. Orange Pi 4
- **Purpose**: Main processing unit and web server
- **Specifications**: 
  - ARM Cortex-A72 quad-core processor
  - 4GB LPDDR4 RAM
  - Gigabit Ethernet
  - WiFi and Bluetooth
- **Role**: Runs Bun/Hono web server, manages SQLite database, handles user authentication

#### 2. Mikrotik Router (hAP ac² or similar)
- **Purpose**: Network management and captive portal
- **Specifications**:
  - Dual-band 2.4/5 GHz WiFi
  - Gigabit Ethernet ports
  - RouterOS with captive portal support
- **Role**: Manages WiFi network, enforces time limits, redirects users to payment page

#### 3. USR-ES1 W5500 Ethernet Module
- **Purpose**: Hardware SPI to LAN connectivity
- **Specifications**:
  - W5500 TCP/IP embedded Ethernet controller
  - Hardware SPI interface
  - 10/100 Mbps Ethernet
- **Role**: Provides reliable network interface for ESP32 communication

#### 4. ESP32 Development Board
- **Purpose**: Sensor control and system automation
- **Specifications**:
  - Dual-core processor
  - WiFi and Bluetooth
  - Multiple GPIO pins
  - ADC capabilities
- **Role**: Controls sensors, detects bottles, communicates with main system

### Additional Components

#### Sensors
- **IR Infrared Sensor**: Detects bottle presence
- **Load Cell/Weight Sensor**: Verifies bottle weight (minimum 10g)
- **Ultrasonic Sensor**: Measures bottle dimensions
- **Optional Camera Module**: Material verification (AI-based)

#### Power Supply
- **5V 3A Power Adapter**: For Orange Pi 4
- **12V 2A Power Adapter**: For Mikrotik router
- **5V 1A Power Supply**: For ESP32 and sensors

#### Mechanical Components
- **Plastic Bottle Collection Bin**: Weather-resistant enclosure
- **Bottle Insertion Slot**: Standard bottle opening (3-5 cm diameter)
- **Sensor Mounting Brackets**: Custom 3D printed or metal brackets
- **Weatherproof Housing**: For outdoor installation

---

## Software Requirements

### Operating Systems
- **Orange Pi 4**: Armbian or Ubuntu Server 20.04+
- **Mikrotik**: RouterOS (latest version)
- **ESP32**: Arduino IDE or ESP-IDF

### Development Tools
- **Bun**: Latest runtime for JavaScript/TypeScript
- **Hono**: Fast web framework for API development
- **SQLite**: Embedded database for session management
- **TypeScript**: For type-safe development
- **Git**: Version control

### Libraries and Dependencies
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Project dependencies
bun init
bun add hono better-sqlite3 @hono/node-server
bun add -d @types/node typescript

# Python dependencies (ESP32)
pip install machine network urequests

# Mikrotik RouterOS scripts
# Built-in scripting language
```

---

## Step-by-Step Assembly

### Phase 1: Hardware Setup

#### Step 1: Orange Pi 4 Configuration
1. Flash Armbian to SD card
2. Boot Orange Pi 4 and perform initial setup
3. Connect to network via Ethernet
4. Update system: `sudo apt update && sudo apt upgrade`
5. Install required packages:
   ```bash
   sudo apt install nginx mysql-server nodejs npm python3-pip
   ```

#### Step 2: Mikrotik Router Configuration
1. Connect Mikrotik to power and network
2. Access RouterOS via WinBox or web interface
3. Configure basic network settings:
   - Set WAN interface for internet connection
   - Configure LAN interface for local network
   - Setup WiFi network "EcoWiFi-Guest"
4. Update RouterOS to latest version

#### Step 3: ESP32 and Sensor Assembly
1. Connect sensors to ESP32 GPIO pins:
   ```
   IR Sensor: GPIO 4
   Load Cell: GPIO 22, 23 (SDA, SCL)
   Ultrasonic: GPIO 5, 18 (Trigger, Echo)
   W5500 Module: SPI pins (MISO, MOSI, SCK, CS)
   ```
2. Mount sensors in bottle collection bin:
   - IR sensor at bottle insertion point
   - Load cell under collection platform
   - Ultrasonic sensor above insertion slot
3. Connect ESP32 to power and W5500 module

#### Step 4: Network Wiring
1. Connect Orange Pi 4 to Mikrotik LAN port
2. Connect W5500 module to Mikrotik LAN port
3. Ensure all devices have proper IP addressing:
   - Orange Pi 4: 192.168.1.10
   - Mikrotik: 192.168.1.1
   - ESP32/W5500: 192.168.1.20

### Phase 2: Mechanical Assembly

#### Step 5: Enclosure Construction
1. Design weatherproof housing for all components
2. Create bottle insertion slot with proper dimensions
3. Mount sensors securely in designated positions
4. Ensure proper ventilation for electronics
5. Add security features to prevent tampering

#### Step 6: Cable Management
1. Use weatherproof cable glands for external connections
2. Organize internal wiring with cable ties
3. Label all connections for easy maintenance
4. Add strain relief for all external cables

---

## Network Configuration

### Mikrotik Router Setup

#### WiFi Configuration
```routeros
/interface wireless
set [find name=wlan1] ssid="EcoWiFi-Guest" mode=ap-bridge band=2ghz-g/n \
    frequency=2412 disabled=no

/interface wireless security-profiles
set [find default/] authentication-types=wpa2-psk wpa2-pre-shared-key="EcoWiFi2024" \
    mode=dynamic-keys
```

#### Captive Portal Setup
```routeros
/ip hotspot
add name="EcoWiFi-Hotspot" interface=wlan1 address-pool=hs-pool \
    profile="hsprof1" disabled=no

/ip hotspot profile
set [find default/] html-directory=flash/hotspot \
    login-by=http-chap,http-pap,cookie,mac
```

#### Time Limit Configuration
```routeros
/ip hotspot user profile
set [find default/] session-timeout=15m \
    idle-timeout=5m keepalive-timeout=1m
```

### Orange Pi 4 Network Setup

#### Static IP Configuration
```bash
# Edit /etc/netplan/01-netcfg.yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: no
      addresses: [192.168.1.10/24]
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

#### SQLite Database Setup
```sql
-- Create database file and tables
-- File: ecowifi.db

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mac_address TEXT UNIQUE NOT NULL,
    session_start DATETIME,
    session_end DATETIME,
    bottles_deposited INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired'))
);

CREATE TABLE bottle_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    weight REAL,
    size REAL,
    material_confirmed BOOLEAN DEFAULT FALSE,
    mac_address TEXT
);

CREATE TABLE system_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE UNIQUE NOT NULL,
    total_bottles INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    co2_saved REAL DEFAULT 0.0
);
```

---

## Software Setup

### Backend Application (Bun + Hono + SQLite)

#### Project Setup
```bash
# Initialize project
bun init ecowifi-server
cd ecowifi-server

# Install dependencies
bun add hono better-sqlite3 @hono/node-server
bun add -d @types/node typescript

# Create project structure
mkdir src
mkdir src/routes
mkdir src/models
mkdir src/middleware
```

#### Main Server File (src/index.ts)
```typescript
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import Database from 'better-sqlite3';
import { bottleRoutes } from './routes/bottle';
import { userRoutes } from './routes/user';
import { statsRoutes } from './routes/stats';

const app = new Hono();

// Initialize SQLite database
const db = new Database('ecowifi.db');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mac_address TEXT UNIQUE NOT NULL,
    session_start DATETIME,
    session_end DATETIME,
    bottles_deposited INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired'))
  );

  CREATE TABLE IF NOT EXISTS bottle_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    weight REAL,
    size REAL,
    material_confirmed BOOLEAN DEFAULT FALSE,
    mac_address TEXT
  );

  CREATE TABLE IF NOT EXISTS system_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE UNIQUE NOT NULL,
    total_bottles INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    co2_saved REAL DEFAULT 0.0
  );
`);

// Middleware
app.use('/*', cors());
app.use('/static/*', serveStatic({ root: './public' }));

// Routes
app.route('/api/bottle', bottleRoutes);
app.route('/api/user', userRoutes);
app.route('/api/stats', statsRoutes);

// Serve captive portal
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>EcoWiFi Access</title>
        <script src="https://cdn.tailwindcss.com"></script>
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
          </div>
        </div>
        <script src="/static/js/portal.js"></script>
      </body>
    </html>
  `);
});

// WebSocket for real-time updates
app.get('/ws', async (c) => {
  return c.text('WebSocket endpoint');
});

const port = 3000;
console.log(`EcoWiFi server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
```

#### Bottle Routes (src/routes/bottle.ts)
```typescript
import { Hono } from 'hono';
import Database from 'better-sqlite3';

const db = new Database('ecowifi.db');
const app = new Hono();

// Record bottle deposit and grant WiFi access
app.post('/deposit', async (c) => {
  try {
    const { macAddress, weight, size } = await c.req.json();
    
    // Validate bottle
    if (weight < 10 || size < 5) {
      return c.json({ error: 'Invalid bottle detected' }, 400);
    }
    
    // Log bottle deposit
    const stmt = db.prepare(`
      INSERT INTO bottle_logs (weight, size, mac_address)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(weight, size, macAddress);
    
    // Update or create user session
    const userStmt = db.prepare(`
      INSERT OR REPLACE INTO users (mac_address, session_start, session_end, bottles_deposited, status)
      VALUES (?, datetime('now'), datetime('now', '+15 minutes'), 
              COALESCE((SELECT bottles_deposited FROM users WHERE mac_address = ?), 0) + 1, 'active')
    `);
    
    userStmt.run(macAddress, macAddress);
    
    // Update daily stats
    const statsStmt = db.prepare(`
      INSERT OR REPLACE INTO system_stats (date, total_bottles, co2_saved)
      VALUES (date('now'), 
              COALESCE((SELECT total_bottles FROM system_stats WHERE date = date('now')), 0) + 1,
              COALESCE((SELECT co2_saved FROM system_stats WHERE date = date('now')), 0) + 0.082)
    `);
    
    statsStmt.run();
    
    // Grant WiFi access via Mikrotik API
    await grantWifiAccess(macAddress);
    
    return c.json({ 
      success: true, 
      sessionId: result.lastInsertRowid,
      message: 'WiFi access granted for 15 minutes'
    });
    
  } catch (error) {
    console.error('Bottle deposit error:', error);
    return c.json({ error: 'Failed to process bottle deposit' }, 500);
  }
});

// Get bottle history
app.get('/history', (c) => {
  const stmt = db.prepare(`
    SELECT * FROM bottle_logs 
    ORDER BY timestamp DESC 
    LIMIT 100
  `);
  
  const history = stmt.all();
  return c.json(history);
});

async function grantWifiAccess(macAddress: string) {
  // Mikrotik API implementation
  // Use HTTP requests to Mikrotik API
  try {
    const response = await fetch('http://192.168.1.1/api/hotspot/user/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('admin:password')
      },
      body: JSON.stringify({
        name: macAddress,
        password: 'ecowifi2024',
        limit_uptime: '15m'
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to grant WiFi access:', error);
    return false;
  }
}

export { app as bottleRoutes };
```

#### User Routes (src/routes/user.ts)
```typescript
import { Hono } from 'hono';
import Database from 'better-sqlite3';

const db = new Database('ecowifi.db');
const app = new Hono();

// Get user session info
app.get('/session/:macAddress', (c) => {
  const macAddress = c.req.param('macAddress');
  
  const stmt = db.prepare(`
    SELECT * FROM users 
    WHERE mac_address = ? AND status = 'active' 
    AND datetime(session_end) > datetime('now')
  `);
  
  const user = stmt.get(macAddress);
  
  if (!user) {
    return c.json({ error: 'No active session found' }, 404);
  }
  
  return c.json(user);
});

// Extend session (for multiple bottles)
app.post('/extend', async (c) => {
  const { macAddress } = await c.req.json();
  
  const stmt = db.prepare(`
    UPDATE users 
    SET session_end = datetime(session_end, '+15 minutes'),
        bottles_deposited = bottles_deposited + 1
    WHERE mac_address = ? AND status = 'active'
  `);
  
  const result = stmt.run(macAddress);
  
  if (result.changes === 0) {
    return c.json({ error: 'User not found or session expired' }, 404);
  }
  
  return c.json({ success: true, message: 'Session extended by 15 minutes' });
});

export { app as userRoutes };
```

#### Stats Routes (src/routes/stats.ts)
```typescript
import { Hono } from 'hono';
import Database from 'better-sqlite3';

const db = new Database('ecowifi.db');
const app = new Hono();

// Get system statistics
app.get('/dashboard', (c) => {
  const today = db.prepare(`
    SELECT * FROM system_stats WHERE date = date('now')
  `).get();
  
  const totalBottles = db.prepare(`
    SELECT COUNT(*) as count FROM bottle_logs
  `).get();
  
  const activeSessions = db.prepare(`
    SELECT COUNT(*) as count FROM users 
    WHERE status = 'active' AND datetime(session_end) > datetime('now')
  `).get();
  
  return c.json({
    today: today || { total_bottles: 0, total_sessions: 0, co2_saved: 0 },
    totalBottles: totalBottles.count,
    activeSessions: activeSessions.count
  });
});

export { app as statsRoutes };
```

#### Package.json Configuration
```json
{
  "name": "ecowifi-server",
  "version": "1.0.0",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --outdir ./dist --target bun",
    "start": "bun run dist/index.js",
    "db:migrate": "bun run src/migrate.ts"
  },
  "dependencies": {
    "hono": "^3.12.0",
    "better-sqlite3": "^9.2.2",
    "@hono/node-server": "^1.8.2"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  }
}
```

### Frontend Client (JavaScript)

#### Captive Portal Client (public/js/portal.js)
```javascript
class EcoWiFiPortal {
  constructor() {
    this.statusElement = document.getElementById('status');
    this.statusText = document.getElementById('status-text');
    this.timerElement = document.getElementById('timer');
    this.minutesElement = document.getElementById('minutes');
    this.secondsElement = document.getElementById('seconds');
    
    this.init();
  }
  
  init() {
    // Get user's MAC address (simplified approach)
    this.macAddress = this.getMacAddress();
    
    // Check for existing session
    this.checkSession();
    
    // Start polling for bottle detection
    this.startPolling();
  }
  
  getMacAddress() {
    // In a real implementation, this would come from the captive portal
    // For now, we'll use a placeholder or generate one
    return '00:00:00:00:00:00';
  }
  
  async checkSession() {
    try {
      const response = await fetch(`/api/user/session/${this.macAddress}`);
      const data = await response.json();
      
      if (response.ok) {
        this.showActiveSession(data);
      }
    } catch (error) {
      console.log('No active session found');
    }
  }
  
  async startPolling() {
    setInterval(async () => {
      await this.checkBottleStatus();
    }, 2000);
  }
  
  async checkBottleStatus() {
    try {
      const response = await fetch('/api/bottle/status');
      const data = await response.json();
      
      if (data.bottleDetected) {
        await this.processBottleDeposit();
      }
    } catch (error) {
      console.error('Error checking bottle status:', error);
    }
  }
  
  async processBottleDeposit() {
    try {
      this.updateStatus('Processing bottle...', 'yellow');
      
      const response = await fetch('/api/bottle/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          macAddress: this.macAddress,
          weight: 25.5, // These would come from sensors
          size: 20.0
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        this.updateStatus(data.message, 'green');
        this.startTimer();
        this.updateEnvironmentalStats();
      } else {
        this.updateStatus(data.error || 'Failed to process bottle', 'red');
      }
    } catch (error) {
      this.updateStatus('Error processing bottle', 'red');
    }
  }
  
  updateStatus(message, type) {
    this.statusText.textContent = message;
    
    // Update status styling based on type
    this.statusElement.className = `border-2 rounded-lg p-4 mb-6`;
    
    switch(type) {
      case 'green':
        this.statusElement.classList.add('bg-green-100', 'border-green-300');
        break;
      case 'yellow':
        this.statusElement.classList.add('bg-yellow-100', 'border-yellow-300');
        break;
      case 'red':
        this.statusElement.classList.add('bg-red-100', 'border-red-300');
        break;
      default:
        this.statusElement.classList.add('bg-gray-100', 'border-gray-300');
    }
  }
  
  startTimer() {
    this.timerElement.classList.remove('hidden');
    
    let timeLeft = 15 * 60; // 15 minutes
    const timerInterval = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      
      this.minutesElement.textContent = minutes.toString().padStart(2, '0');
      this.secondsElement.textContent = seconds.toString().padStart(2, '0');
      
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        this.showExpiredMessage();
      }
      
      timeLeft--;
    }, 1000);
  }
  
  showExpiredMessage() {
    this.updateStatus('Session expired. Insert another bottle to continue.', 'red');
  }
  
  updateEnvironmentalStats() {
    const bottleCount = parseInt(document.getElementById('bottle-count').textContent) + 1;
    document.getElementById('bottle-count').textContent = bottleCount;
    document.getElementById('co2-saved').textContent = (bottleCount * 0.082).toFixed(2);
  }
}

// Initialize portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new EcoWiFiPortal();
});
```

### ESP32 Code (Arduino IDE)

#### Main Sensor Controller
```cpp
#include <WiFi.h>
#include <Ethernet.h>
#include <SPI.h>
#include <HX711.h>
#include <NewPing.h>

// Pin definitions
#define IR_SENSOR_PIN 4
#define TRIGGER_PIN 5
#define ECHO_PIN 18
#define LOAD_CELL_DOUT_PIN 22
#define LOAD_CELL_SCK_PIN 23

// Network configuration
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress serverIP(192, 168, 1, 10);
int serverPort = 3000;

// Sensor objects
HX711 loadCell;
NewPing sonar(TRIGGER_PIN, ECHO_PIN, 200);

// Ethernet client
EthernetClient client;

void setup() {
    Serial.begin(115200);
    
    // Initialize sensors
    pinMode(IR_SENSOR_PIN, INPUT);
    loadCell.begin(LOAD_CELL_DOUT_PIN, LOAD_CELL_SCK_PIN);
    loadCell.set_scale(2280.f); // Calibration factor
    loadCell.tare();
    
    // Initialize Ethernet
    Ethernet.begin(mac);
    
    Serial.println("EcoWiFi Sensor Controller Initialized");
}

void loop() {
    checkForBottle();
    delay(100);
}

void checkForBottle() {
    int irValue = digitalRead(IR_SENSOR_PIN);
    
    if (irValue == LOW) { // Bottle detected
        Serial.println("Bottle detected!");
        
        // Get measurements
        float weight = getWeight();
        float distance = getDistance();
        
        if (weight > 10.0 && distance < 30.0) { // Valid bottle
            sendBottleData(weight, distance);
            delay(5000); // Prevent duplicate readings
        }
    }
}

float getWeight() {
    return loadCell.get_units(10);
}

float getDistance() {
    unsigned int uS = sonar.ping();
    return uS / US_ROUNDTRIP_CM;
}

void sendBottleData(float weight, float distance) {
    if (client.connect(serverIP, serverPort)) {
        String postData = "{\"mac_address\":\"" + 
                         WiFi.macAddress() + 
                         "\",\"weight\":" + weight + 
                         ",\"size\":" + distance + "}";
        
        client.println("POST /api/bottle-deposit HTTP/1.1");
        client.println("Host: " + String(serverIP));
        client.println("Content-Type: application/json");
        client.println("Content-Length: " + String(postData.length()));
        client.println();
        client.println(postData);
        
        client.stop();
        Serial.println("Bottle data sent successfully");
    } else {
        Serial.println("Failed to connect to server");
    }
}
```

---

## Sensor Integration

### IR Sensor Setup
```cpp
// IR sensor for bottle detection
void setupIRSensor() {
    pinMode(IR_SENSOR_PIN, INPUT_PULLUP);
}

bool isBottlePresent() {
    return digitalRead(IR_SENSOR_PIN) == LOW;
}
```

### Load Cell Calibration
```cpp
void calibrateLoadCell() {
    Serial.println("Load cell calibration...");
    Serial.println("Remove all weight from scale");
    delay(2000);
    
    loadCell.tare();
    Serial.println("Tare complete");
    
    Serial.println("Place known weight on scale");
    delay(5000);
    
    float reading = loadCell.get_units(10);
    float knownWeight = 100.0; // 100g calibration weight
    
    float calibrationFactor = reading / knownWeight;
    loadCell.set_scale(calibrationFactor);
    
    Serial.print("Calibration factor: ");
    Serial.println(calibrationFactor);
}
```

### Ultrasonic Sensor Configuration
```cpp
float getBottleHeight() {
    unsigned int uS = sonar.ping_median(5);
    float distance = uS / US_ROUNDTRIP_CM;
    
    // Convert distance to bottle height
    float maxHeight = 25.0; // Maximum expected bottle height
    float bottleHeight = maxHeight - distance;
    
    return max(0, bottleHeight);
}
```

---

## Captive Portal Configuration

### HTML Portal Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoWiFi - Get Internet Access</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/socket.io/socket.io.js"></script>
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
    
    <script>
        const socket = io();
        
        socket.on('status-update', (data) => {
            updateStatus(data);
        });
        
        function updateStatus(data) {
            const statusEl = document.getElementById('status');
            const statusText = document.getElementById('status-text');
            
            if (data.bottleDetected) {
                statusEl.className = 'bg-green-100 border-2 border-green-300 rounded-lg p-4 mb-6';
                statusText.textContent = 'Bottle detected! Granting access...';
                
                setTimeout(() => {
                    startTimer();
                    showSuccessMessage();
                }, 2000);
            }
        }
        
        function startTimer() {
            const timerEl = document.getElementById('timer');
            timerEl.classList.remove('hidden');
            
            let timeLeft = 15 * 60; // 15 minutes in seconds
            const timerInterval = setInterval(() => {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                
                document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
                document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    showExpiredMessage();
                }
                
                timeLeft--;
            }, 1000);
        }
        
        function showSuccessMessage() {
            const statusEl = document.getElementById('status');
            const statusText = document.getElementById('status-text');
            
            statusEl.className = 'bg-green-100 border-2 border-green-300 rounded-lg p-4 mb-6';
            statusText.textContent = 'Access granted! Enjoy your 15 minutes of WiFi.';
            
            // Update environmental stats
            const bottleCount = parseInt(document.getElementById('bottle-count').textContent) + 1;
            document.getElementById('bottle-count').textContent = bottleCount;
            document.getElementById('co2-saved').textContent = (bottleCount * 0.082).toFixed(2);
        }
        
        function showExpiredMessage() {
            const statusEl = document.getElementById('status');
            const statusText = document.getElementById('status-text');
            
            statusEl.className = 'bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-6';
            statusText.textContent = 'Session expired. Insert another bottle to continue.';
        }
    </script>
</body>
</html>
```

---

## Testing and Deployment

### Pre-Deployment Testing Checklist

#### Hardware Testing
- [ ] Power all components and verify LED indicators
- [ ] Test sensor functionality with sample bottles
- [ ] Verify network connectivity between all devices
- [ ] Test WiFi signal strength and coverage area
- [ ] Check weatherproofing of enclosure

#### Software Testing
- [ ] Verify database connectivity and operations
- [ ] Test captive portal redirection
- [ ] Validate bottle detection and WiFi granting process
- [ ] Test session timeout functionality
- [ ] Verify real-time status updates

#### Integration Testing
- [ ] End-to-end bottle deposit to WiFi access flow
- [ ] Multiple concurrent user sessions
- [ ] System recovery after power outage
- [ ] Sensor calibration and accuracy
- [ ] Network failover scenarios

### Deployment Steps

#### Site Preparation
1. Choose location with high foot traffic
2. Ensure power availability (outdoor rated)
3. Verify internet connectivity options
4. Check for proper mounting surfaces
5. Assess environmental protection needs

#### Installation
1. Mount main enclosure securely
2. Connect power and internet cables
3. Position WiFi antenna for optimal coverage
4. Install signage and user instructions
5. Test system with sample bottles

#### Final Configuration
1. Set up remote monitoring
2. Configure alerts for system failures
3. Establish maintenance schedule
4. Train local staff on basic troubleshooting
5. Document system location and access details

---

## Troubleshooting

### Common Issues and Solutions

#### Hardware Issues

**Problem: Sensors not detecting bottles**
- Check sensor power connections
- Verify sensor alignment and positioning
- Calibrate sensors according to specifications
- Check for environmental interference (dust, moisture)

**Problem: Network connectivity issues**
- Verify Ethernet cable connections
- Check IP address configurations
- Test Mikrotik router functionality
- Restart network equipment in sequence

**Problem: Power supply failures**
- Check power adapter specifications
- Verify voltage levels at components
- Test backup power systems
- Check for loose connections

#### Software Issues

**Problem: Captive portal not redirecting**
- Verify Mikrotik hotspot configuration
- Check DNS settings
- Test portal accessibility from different devices
- Review firewall rules

**Problem: Database connection errors**
- Verify MySQL service status
- Check database credentials
- Test network connectivity to database server
- Review database logs for errors

**Problem: Session management issues**
- Verify time synchronization between devices
- Check session timeout configurations
- Review user authentication logs
- Test session cleanup processes

#### Performance Issues

**Problem: Slow WiFi speeds**
- Check internet bandwidth availability
- Verify Mikrotik QoS settings
- Test WiFi channel interference
- Consider bandwidth limiting per user

**Problem: System responsiveness**
- Monitor CPU and memory usage
- Check database query performance
- Review network latency
- Optimize application code

### Maintenance Schedule

#### Daily Checks
- Verify system status indicators
- Check for error messages in logs
- Monitor user session counts
- Verify internet connectivity

#### Weekly Maintenance
- Clean sensors and optical components
- Check cable connections and security
- Review system performance metrics
- Update software if needed

#### Monthly Tasks
- Calibrate sensors
- Test backup systems
- Review and update security settings
- Perform comprehensive system diagnostics

#### Quarterly Reviews
- Assess environmental impact metrics
- Evaluate system performance trends
- Plan hardware upgrades if needed
- Review and update documentation

---

## Safety and Security Considerations

### Electrical Safety
- Use properly rated power supplies
- Implement surge protection
- Ensure proper grounding
- Use weatherproof connections for outdoor installations

### Network Security
- Implement WPA2/WPA3 encryption
- Regularly update router firmware
- Monitor for unauthorized access attempts
- Implement network segmentation

### Physical Security
- Use tamper-resistant enclosures
- Install security cameras if needed
- Implement access control for maintenance
- Use weatherproof materials for outdoor use

---

## Environmental Impact Tracking

### Metrics to Monitor
- Number of bottles collected
- Estimated CO₂ emissions saved
- Recycling rate improvement
- Community engagement levels

### Reporting
- Generate monthly impact reports
- Share environmental benefits with community
- Track system utilization patterns
- Identify opportunities for expansion

---

## Future Enhancements

### Potential Upgrades
- Solar power integration
- AI-powered material verification
- Mobile app for user engagement
- Expanded recycling material acceptance
- Community reward programs

### Scalability Considerations
- Multi-location management
- Centralized monitoring dashboard
- Automated maintenance alerts
- Cloud-based analytics platform

---

## Conclusion

The EcoWiFi system provides an innovative solution for combining environmental sustainability with digital inclusion. By following this comprehensive guide, you can successfully deploy a system that encourages plastic bottle recycling while providing valuable internet access to communities.

Regular maintenance and monitoring will ensure long-term reliability and maximum environmental impact. Consider starting with a pilot installation to validate the system before scaling to multiple locations.

For additional support or questions, refer to the component documentation and community forums for each hardware component used in this system.