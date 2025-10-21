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
- **Role**: Runs the main application, manages database, handles user authentication

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
- **Node.js**: v16+ for backend services
- **Python**: v3.8+ for sensor scripts
- **MySQL/MariaDB**: For user session management
- **Nginx**: Web server for captive portal
- **Git**: Version control

### Libraries and Dependencies
```bash
# Node.js dependencies
npm install express mysql2 socket.io node-cron

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

#### Database Setup
```sql
CREATE DATABASE ecowifi;
USE ecowifi;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mac_address VARCHAR(17) UNIQUE,
    session_start DATETIME,
    session_end DATETIME,
    bottles_deposited INT DEFAULT 0,
    status ENUM('active', 'expired') DEFAULT 'active'
);

CREATE TABLE bottle_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    weight DECIMAL(5,2),
    size DECIMAL(5,2),
    material_confirmed BOOLEAN DEFAULT FALSE
);
```

---

## Software Setup

### Backend Application (Node.js)

#### Main Server File (server.js)
```javascript
const express = require('express');
const mysql = require('mysql2');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'ecowifi',
    password: 'password',
    database: 'ecowifi'
});

// Middleware
app.use(express.static('public'));
app.use(express.json());

// API Routes
app.post('/api/bottle-deposit', (req, res) => {
    const { macAddress, weight, size } = req.body;
    
    // Log bottle deposit
    db.query(
        'INSERT INTO bottle_logs (weight, size) VALUES (?, ?)',
        [weight, size],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Grant WiFi access via Mikrotik API
            grantWifiAccess(macAddress);
            
            res.json({ success: true, sessionId: result.insertId });
        }
    );
});

function grantWifiAccess(macAddress) {
    // Mikrotik API call to add user to hotspot
    // Implementation depends on Mikrotik API library
}

// Socket.IO for real-time updates
io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('sensor-data', (data) => {
        // Broadcast sensor status to all connected clients
        socket.broadcast.emit('status-update', data);
    });
});

server.listen(3000, () => {
    console.log('EcoWiFi server running on port 3000');
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