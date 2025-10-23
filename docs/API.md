# EcoWiFi API Documentation

## Overview

The EcoWiFi API provides endpoints for managing bottle deposits, user sessions, and system statistics. All endpoints return JSON responses and follow RESTful conventions.

## Base URL

```
http://localhost:3001
```

## Authentication

Currently, the API does not require authentication. In production, API keys or JWT tokens should be implemented.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Endpoints

### Bottle Management

#### POST /api/bottle/deposit
Record a bottle deposit and grant WiFi access.

**Request Body:**
```json
{
  "macAddress": "00:11:22:33:44:55",
  "weight": 25.5,
  "size": 20.0
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": 123,
  "message": "WiFi access granted for 15 minutes"
}
```

**Validation:**
- `weight`: Must be > 10g
- `size`: Must be > 5cm
- `macAddress`: Valid MAC address format

#### GET /api/bottle/status
Check for recent bottle deposits (used for polling).

**Response:**
```json
{
  "bottleDetected": true
}
```

#### GET /api/bottle/history
Get bottle deposit history.

**Query Parameters:**
- `limit`: Number of records to return (default: 100)

**Response:**
```json
[
  {
    "id": 1,
    "timestamp": "2025-10-22 09:31:25",
    "weight": 25.5,
    "size": 20.0,
    "material_confirmed": false,
    "mac_address": "00:11:22:33:44:55"
  }
]
```

### User Sessions

#### GET /api/user/session/:macAddress
Get user session information.

**Path Parameters:**
- `macAddress`: User's MAC address

**Response:**
```json
{
  "id": 1,
  "mac_address": "00:11:22:33:44:55",
  "session_start": "2025-10-22 09:31:25",
  "session_end": "2025-10-22 09:46:25",
  "bottles_deposited": 2,
  "status": "active"
}
```

#### POST /api/user/extend
Extend user session for additional bottles.

**Request Body:**
```json
{
  "macAddress": "00:11:22:33:44:55"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session extended by 15 minutes"
}
```

#### GET /api/user/active
Get all active user sessions.

**Response:**
```json
[
  {
    "mac_address": "00:11:22:33:44:55",
    "session_start": "2025-10-22 09:31:25",
    "session_end": "2025-10-22 09:46:25",
    "bottles_deposited": 2
  }
]
```

#### POST /api/user/cleanup
Clean up expired sessions.

**Response:**
```json
{
  "expired": 5
}
```

### Statistics

#### GET /api/stats/dashboard
Get system statistics dashboard.

**Response:**
```json
{
  "today": {
    "id": 1,
    "date": "2025-10-22",
    "total_bottles": 10,
    "total_sessions": 8,
    "co2_saved": 0.82
  },
  "totalBottles": 150,
  "activeSessions": 3,
  "totalUsers": 45
}
```

#### GET /api/stats/history/:days
Get historical statistics.

**Path Parameters:**
- `days`: Number of days to retrieve (default: 7)

**Response:**
```json
[
  {
    "id": 1,
    "date": "2025-10-22",
    "total_bottles": 10,
    "total_sessions": 8,
    "co2_saved": 0.82
  }
]
```

#### GET /api/stats/realtime
Get real-time metrics.

**Response:**
```json
{
  "bottlesLastHour": 5,
  "activeNow": 3,
  "todayTotal": 10,
  "timestamp": "2025-10-22T09:31:25.534Z"
}
```

#### POST /api/stats/reset-today
Reset today's statistics (for testing).

**Response:**
```json
{
  "success": true,
  "message": "Today's stats reset"
}
```

### System

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T09:31:25.534Z"
}
```

#### GET /
Captive portal interface (HTML response).

#### GET /ws
WebSocket endpoint for real-time updates (coming soon).

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

## Rate Limiting

Currently not implemented, but recommended for production:
- 100 requests per minute per IP
- Burst limit of 20 requests

## CORS

The API supports CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## WebSocket Events (Planned)

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3001/ws');

// Listen for events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'bottle_detected':
      // Handle bottle detection
      break;
    case 'session_updated':
      // Handle session updates
      break;
    case 'stats_updated':
      // Handle statistics updates
      break;
  }
};
```

## SDK Examples

### JavaScript/Node.js

```javascript
const API_BASE = 'http://localhost:3001';

async function depositBottle(macAddress, weight, size) {
  const response = await fetch(`${API_BASE}/api/bottle/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ macAddress, weight, size })
  });
  
  return await response.json();
}

async function getUserSession(macAddress) {
  const response = await fetch(`${API_BASE}/api/user/session/${macAddress}`);
  return await response.json();
}

async function getStats() {
  const response = await fetch(`${API_BASE}/api/stats/dashboard`);
  return await response.json();
}
```

### Python

```python
import requests

API_BASE = 'http://localhost:3001'

def deposit_bottle(mac_address, weight, size):
    response = requests.post(f'{API_BASE}/api/bottle/deposit', json={
        'macAddress': mac_address,
        'weight': weight,
        'size': size
    })
    return response.json()

def get_user_session(mac_address):
    response = requests.get(f'{API_BASE}/api/user/session/{mac_address}')
    return response.json()

def get_stats():
    response = requests.get(f'{API_BASE}/api/stats/dashboard')
    return response.json()
```

## Testing

Use the following curl commands to test the API:

```bash
# Health check
curl http://localhost:3001/health

# Deposit bottle
curl -X POST http://localhost:3001/api/bottle/deposit \
  -H "Content-Type: application/json" \
  -d '{"macAddress":"00:11:22:33:44:55","weight":25.5,"size":20.0}'

# Get user session
curl http://localhost:3001/api/user/session/00:11:22:33:44:55

# Get stats
curl http://localhost:3001/api/stats/dashboard
```