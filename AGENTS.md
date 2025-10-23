# RecyFi System - Agent Development Guide

## 🌐 System Overview

RecyFi is a plastic recycling WiFi system that provides 5 minutes of free internet access in exchange for plastic deposits. The system integrates hardware sensors, web interfaces, and Mikrotik router management.

## 🔗 Remote Access

### Production System
- **Orange Pi Server**: `ssh root@10.56.7.100` (password: ken)
- **Mikrotik Router**: WinBox at `10.56.13.214` (admin/ken)
- **Web Interface**: `http://10.56.7.100:9999`

### Development Environment
- **Local Development**: Use environment variables in `.env`
- **Testing**: Local server with mock Mikrotik integration
- **Database**: In-memory JSON storage for development

## 🚀 Build & Deployment Commands

### Production Deployment
```bash
# Deploy to Orange Pi
scp -r ecowifi-server root@10.56.7.100:/root/
ssh root@10.56.7.100

# On Orange Pi
cd ecowifi-server
npm install
npm start
```

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:init
npm run db:migrate
```

### Service Management
```bash
# Systemd service
sudo systemctl status recyfi
sudo systemctl restart recyfi
sudo journalctl -u recyfi -f
```

## 📋 Code Style Guidelines

### TypeScript/JavaScript
- **Runtime**: Node.js v18+ (production), Bun (development)
- **Syntax**: ES6+ with async/await patterns
- **Type Safety**: TypeScript for new development, JavaScript for production
- **Import Order**: External libraries → internal modules → relative imports
- **File Naming**: kebab-case for files, PascalCase for classes
- **Indentation**: 2 spaces consistently

### Backend Architecture
- **Framework**: Hono for routing, Node.js runtime
- **Database**: In-memory JSON storage with file persistence
- **API Design**: RESTful endpoints with consistent JSON responses
- **Error Handling**: try-catch blocks with proper HTTP status codes
- **Security**: Input validation, CORS configuration, rate limiting

### Frontend Development
- **Styling**: Tailwind CSS via CDN
- **JavaScript**: Vanilla JS with modern ES6+ features
- **Design**: Mobile-first responsive approach
- **Real-time**: Polling for live updates (WebSocket future enhancement)
- **UX**: Progressive enhancement for various device capabilities

### Database Schema
```javascript
// Users Collection
{
  id: number,
  mac_address: string,
  session_start: string,
  session_end: string,
  bottles_deposited: number
}

// Bottle Logs Collection
{
  id: number,
  timestamp: string,
  material_confirmed: boolean,
  mac_address: string
}

// System Stats Collection
{
  id: number,
  date: string,
  total_bottles: number,
  total_sessions: number
}
```

## 🔧 Mikrotik Integration

### SSH Communication
- **Method**: Expect scripts for password authentication
- **Security**: SSH key-based authentication preferred
- **Commands**: RouterOS CLI via SSH
- **Error Handling**: Timeout and retry mechanisms

### Hotspot Management
```bash
# Create hotspot user
/ip hotspot user add name="<MAC_ADDRESS>" password="recyfi2024" profile="5min-access" comment="RecyFi plastic deposit"

# Check active users
/ip hotspot user print where comment~"RecyFi"

# Monitor sessions
/ip hotspot active print
```

### User Profile Configuration
- **Profile Name**: `5min-access`
- **Session Timeout**: 5 minutes
- **Idle Timeout**: 2 minutes
- **Password**: `recyfi2024` (standard for all users)

## 🌐 API Endpoints

### Core Endpoints
```javascript
// Plastic Deposit
POST /api/bottle/deposit
{
  "macAddress": "00:11:22:33:44:55"
}
// Response: {"success": true, "sessionId": 123, "message": "WiFi access granted for 5 minutes"}

// Status Check
GET /api/bottle/status
// Response: {"bottleDetected": true/false}

// User Session
GET /api/user/session/:macAddress
// Response: User session information

// Statistics
GET /api/stats/dashboard
// Response: System statistics and metrics
```

### Response Format
```javascript
// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}

// Error Response
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

## 🎛️ Hardware Integration

### ESP32 Sensor Configuration
```cpp
// Ultrasonic Sensors (HC-SR04)
#define TOP_SENSOR_TRIG  D1
#define TOP_SENSOR_ECHO  D2
#define BOTTOM_SENSOR_TRIG D3
#define BOTTOM_SENSOR_ECHO D4

// Servo Motor (MG996R)
#define SERVO_PIN D5

// Spectroscopy Sensor (AS7265x)
#define SDA_PIN D6
#define SCL_PIN D7
```

### Sensor Logic
- **Top Sensor**: Detects plastic insertion (distance < 10cm)
- **Bottom Sensor**: Monitors bin level (distance > 30cm = full)
- **Spectroscopy**: Identifies plastic type (PET, HDPE, etc.)
- **Servo**: Controls sorting mechanism

### Communication Protocol
```cpp
// HTTP POST to server
POST /api/bottle/deposit
Content-Type: application/json
{
  "macAddress": "ESP32-DEVICE-ID",
  "weight": 25.5,
  "size": 20.0,
  "material": "PET"
}
```

## 🔒 Security Guidelines

### Authentication
- **Mikrotik**: SSH key authentication preferred
- **API**: Input validation and sanitization
- **Sessions**: Automatic timeout after 5 minutes
- **Passwords**: Secure storage, environment variables

### Network Security
- **Firewall**: Restrict access to necessary ports
- **HTTPS**: SSL certificates for production (future)
- **CORS**: Proper configuration for web interface
- **Rate Limiting**: Prevent API abuse

### Data Protection
- **Privacy**: No personal data collection
- **Logging**: Security events and errors
- **Retention**: Session data cleanup after expiration
- **Backup**: Regular database backups

## 📊 Monitoring & Debugging

### Health Checks
```bash
# Server status
curl http://10.56.7.100:9999/health

# API functionality
curl -X POST http://10.56.7.100:9999/api/bottle/deposit \
  -H "Content-Type: application/json" \
  -d '{"macAddress":"TEST-MAC"}'

# Mikrotik connectivity
ssh admin@10.56.13.214 "/ip hotspot user print"
```

### Logging Strategy
```javascript
// Log levels
console.log('info: Normal operation');
console.warn('warning: Non-critical issues');
console.error('error: Critical problems');

// Structured logging
console.log(`📶 Granting WiFi access to MAC: ${macAddress}`);
console.log(`✅ Successfully created hotspot user for ${macAddress}`);
console.error(`❌ Failed to grant WiFi access: ${error.message}`);
```

### Performance Monitoring
- **Response Time**: < 100ms target
- **Memory Usage**: Monitor with `htop`
- **Disk Space**: Log rotation and cleanup
- **Network Latency**: Mikrotik SSH response time

## 🚀 Deployment Workflow

### Pre-deployment Checklist
- [ ] Environment variables configured
- [ ] Mikrotik SSH access verified
- [ ] SSL certificates (if using HTTPS)
- [ ] Firewall rules configured
- [ ] Backup current system
- [ ] Test in staging environment

### Deployment Steps
```bash
# 1. Backup current version
cp -r /root/ecowifi-server /root/ecowifi-server.backup

# 2. Deploy new version
scp -r ecowifi-server root@10.56.7.100:/root/

# 3. Install dependencies
ssh root@10.56.7.100 "cd ecowifi-server && npm install"

# 4. Restart service
ssh root@10.56.7.100 "sudo systemctl restart recyfi"

# 5. Verify deployment
curl http://10.56.7.100:9999/health
```

### Rollback Procedure
```bash
# Quick rollback
ssh root@10.56.7.100 "sudo systemctl stop recyfi"
ssh root@10.56.7.100 "cp -r /root/ecowifi-server.backup /root/ecowifi-server"
ssh root@10.56.7.100 "sudo systemctl start recyfi"
```

## 🧪 Testing Guidelines

### Unit Testing
```javascript
// Example test structure
describe('Bottle Deposit API', () => {
  test('should create hotspot user', async () => {
    const response = await request(app)
      .post('/api/bottle/deposit')
      .send({ macAddress: 'TEST-MAC-001' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.sessionId).toBeDefined();
  });
});
```

### Integration Testing
- **Mikrotik Integration**: Test SSH commands
- **End-to-End**: Full user flow testing
- **Load Testing**: Multiple concurrent users
- **Hardware Testing**: Sensor integration

### Manual Testing Checklist
- [ ] Web interface loads correctly
- [ ] Plastic deposit creates hotspot user
- [ ] WiFi access granted for 5 minutes
- [ ] Session tracking works
- [ ] Statistics update correctly
- [ ] Error handling functions

## 🐛 Troubleshooting Guide

### Common Issues

#### Server Not Starting
```bash
# Check port usage
sudo lsof -i :9999

# Check logs
sudo journalctl -u recyfi -n 50

# Verify configuration
node -c working-ssh-server.cjs
```

#### Mikrotik SSH Issues
```bash
# Test SSH manually
ssh admin@10.56.13.214

# Test expect script
/root/mikrotik-ssh.exp TEST-MAC

# Check user creation
ssh admin@10.56.13.214 "/ip hotspot user print"
```

#### Database Issues
```bash
# Check database file
ls -la recyfi.db

# Verify permissions
chmod 644 recyfi.db

# Test database operations
curl http://10.56.7.100:9999/api/stats/dashboard
```

### Debug Mode
```bash
# Start with debug logging
DEBUG=recyfi:* node working-ssh-server.cjs

# Monitor in real-time
tail -f /var/log/recyfi.log

# Network debugging
netstat -tlnp | grep 9999
```

## 📚 Documentation Standards

### Code Comments
```javascript
/**
 * Grants WiFi access by creating Mikrotik hotspot user
 * @param {string} macAddress - Device MAC address
 * @returns {Promise<boolean>} Success status
 */
async function grantWifiAccess(macAddress) {
  // Implementation details...
}
```

### API Documentation
- **Endpoint**: HTTP method and path
- **Parameters**: Request body structure
- **Response**: Success and error formats
- **Examples**: Sample requests and responses

### README Updates
- **Installation**: Step-by-step setup instructions
- **Configuration**: Environment variable details
- **Troubleshooting**: Common issues and solutions
- **Changelog**: Version history and changes

## 🔄 Development Workflow

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature description"
git push origin feature/new-feature

# Create pull request
# Code review
# Merge to main
```

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Security considerations addressed
- [ ] Performance impact assessed

## 🎯 Best Practices

### Performance
- **Database**: Use in-memory storage for speed
- **Caching**: Cache frequently accessed data
- **Connection Pooling**: Reuse SSH connections
- **Async Operations**: Non-blocking I/O

### Security
- **Input Validation**: Sanitize all user inputs
- **Error Handling**: Don't expose sensitive information
- **Authentication**: Secure credential management
- **Monitoring**: Log security events

### Maintainability
- **Modular Design**: Separate concerns
- **Configuration**: Environment-based settings
- **Testing**: Comprehensive test coverage
- **Documentation**: Keep docs updated

---

## 🚀 Quick Start for New Developers

```bash
# 1. Clone repository
git clone <repository-url>
cd recyfi-system

# 2. Setup development environment
cp .env.example .env
# Edit .env with your settings

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev

# 5. Test the system
curl -X POST http://localhost:9999/api/bottle/deposit \
  -H "Content-Type: application/json" \
  -d '{"macAddress":"DEV-TEST-001"}'
```

**System Status**: ✅ **PRODUCTION READY**