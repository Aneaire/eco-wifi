# RecyFi API Documentation

## Overview

RecyFi provides a RESTful API for managing plastic deposits, user sessions, and system statistics. The API is designed to support both web applications and IoT devices like ESP32.

**Base URL**: `http://10.55.11.97:9999`  
**Content-Type**: `application/json`  
**CORS**: Enabled for all origins

---

## Authentication

Currently, the API does not require authentication. In production, API keys or device authentication may be implemented.

---

## Endpoints

### 📊 Statistics API

#### Get Dashboard Statistics
```http
GET /api/stats/dashboard
```

**Response:**
```json
{
  "today": {
    "id": 1,
    "date": "2025-10-22",
    "total_bottles": 5,
    "total_sessions": 3
  },
  "totalBottles": 42,
  "activeSessions": 2,
  "totalUsers": 15
}
```

**Fields:**
- `today`: Today's statistics
- `totalBottles`: All-time plastic count
- `activeSessions`: Currently active WiFi sessions
- `totalUsers`: Unique users who have used the system

---

#### Get Historical Statistics
```http
GET /api/stats/history/{days}
```

**Parameters:**
- `days` (optional): Number of days to retrieve (default: 7)

**Response:**
```json
[
  {
    "id": 1,
    "date": "2025-10-22",
    "total_bottles": 5,
    "total_sessions": 3
  },
  {
    "id": 2,
    "date": "2025-10-21",
    "total_bottles": 8,
    "total_sessions": 4
  }
]
```

---

#### Get System Metrics
```http
GET /api/stats/metrics
```

**Response:**
```json
{
  "bottlesLastHour": 3,
  "bottlesToday": 5,
  "averagePerHour": 2.5,
  "peakHour": "14:00",
  "systemUptime": "2 days, 3 hours"
}
```

---

### 🍶 Bottle Deposit API

#### Record Plastic Deposit
```http
POST /api/bottle/deposit
```

**Request Body:**
```json
{
  "macAddress": "REC:USER:12345"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": 42,
  "message": "WiFi access granted for 5 minutes"
}
```

**Behavior:**
- Creates new user session or extends existing one
- Grants 5 minutes of WiFi access
- Logs plastic deposit for statistics
- Updates daily metrics

---

#### Get Deposit History
```http
GET /api/bottle/history
```

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 100)

**Response:**
```json
[
  {
    "id": 42,
    "timestamp": "2025-10-22T14:30:00.000Z",
    "material_confirmed": false,
    "mac_address": "REC:USER:12345"
  }
]
```

---

#### Check Plastic Detection Status
```http
GET /api/bottle/status
```

**Response:**
```json
{
  "bottleDetected": false
}
```

**Note**: This endpoint is designed for polling from ESP32 sensors

---

### 👤 User Session API

#### Get User Session Information
```http
GET /api/user/session/{macAddress}
```

**Parameters:**
- `macAddress`: User's MAC address

**Response:**
```json
{
  "id": 15,
  "mac_address": "REC:USER:12345",
  "session_start": "2025-10-22T14:30:00.000Z",
  "session_end": "2025-10-22T14:35:00.000Z",
  "bottles_deposited": 2,
  "status": "active"
}
```

**Status Values:**
- `active`: Session is currently valid
- `expired`: Session has ended

---

#### Extend User Session
```http
POST /api/user/extend
```

**Request Body:**
```json
{
  "macAddress": "REC:USER:12345"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session extended by 5 minutes"
}
```

---

#### Get All Active Sessions
```http
GET /api/user/active
```

**Response:**
```json
[
  {
    "mac_address": "REC:USER:12345",
    "session_start": "2025-10-22T14:30:00.000Z",
    "session_end": "2025-10-22T14:35:00.000Z",
    "bottles_deposited": 2
  }
]
```

---

#### Cleanup Expired Sessions
```http
POST /api/user/cleanup
```

**Response:**
```json
{
  "expired": 3
}
```

**Note**: This endpoint is typically called by a cron job or system maintenance

---

### 🔧 System API

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T14:30:00.000Z"
}
```

---

#### WebSocket Endpoint (Future)
```http
GET /ws
```

**Note**: WebSocket support for real-time updates is planned for future implementation

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "error": "Invalid bottle detected"
}
```

### 404 Not Found
```json
{
  "error": "No active session found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to process plastic deposit"
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. In production, rate limiting may be applied to prevent abuse.

---

## Data Models

### User
```typescript
interface User {
  id: number;
  mac_address: string;
  session_start: string;
  session_end: string;
  bottles_deposited: number;
  status: 'active' | 'expired';
}
```

### BottleLog
```typescript
interface BottleLog {
  id: number;
  timestamp: string;
  material_confirmed: boolean;
  mac_address: string;
}
```

### SystemStats
```typescript
interface SystemStats {
  id: number;
  date: string;
  total_bottles: number;
  total_sessions: number;
}
```

---

## Usage Examples

### JavaScript/Node.js
```javascript
// Record a plastic deposit
const response = await fetch('http://10.55.11.97:9999/api/bottle/deposit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    macAddress: 'REC:USER:12345'
  })
});

const result = await response.json();
console.log(result);
// { success: true, sessionId: 42, message: "WiFi access granted for 5 minutes" }
```

### Python
```python
import requests

# Get dashboard statistics
response = requests.get('http://10.55.11.97:9999/api/stats/dashboard')
stats = response.json()
print(f"Total bottles: {stats['totalBottles']}")
```

### cURL
```bash
# Get user session
curl -X GET "http://10.55.11.97:9999/api/user/session/REC:USER:12345"

# Record deposit
curl -X POST "http://10.55.11.97:9999/api/bottle/deposit" \
  -H "Content-Type: application/json" \
  -d '{"macAddress":"REC:USER:12345"}'
```

---

## Deployment Information

- **Server**: Orange Pi One (ARMv7)
- **Runtime**: Node.js 18.19.1
- **Framework**: Hono.js
- **Database**: In-memory with JSON persistence
- **Port**: 9999
- **Service**: systemd managed

---

## Support

For API support or issues, contact the development team or check the system logs on the Orange Pi device.

**Last Updated**: October 22, 2025  
**Version**: 1.0.0