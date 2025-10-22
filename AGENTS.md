# EcoWiFi System - Agent Development Guide

## Remote Access
- Orange Pi One: `ssh root@10.55.11.97` (password: ken)

## Build Commands
- **Development**: `bun run --watch src/index.ts` (starts dev server with hot reload)
- **Build**: `bun build src/index.ts --outdir ./dist --target bun`
- **Production**: `bun run dist/index.js`
- **Database**: `bun run src/migrate.ts` (run database migrations)

## Code Style Guidelines

### TypeScript/JavaScript
- Use TypeScript for all new code with strict type checking
- Import order: external libraries → internal modules → relative imports
- Use ES6+ syntax (async/await, destructuring, arrow functions)
- File naming: kebab-case for files, PascalCase for classes/components

### Backend (Bun + Hono)
- Use Hono router pattern: separate route files in `src/routes/`
- Database operations use better-sqlite3 with prepared statements
- Error handling: try-catch blocks with proper HTTP status codes
- API responses: consistent JSON format with success/error structure

### Frontend
- Use Tailwind CSS for styling (CDN in HTML)
- JavaScript classes for component organization
- Real-time updates via WebSocket or polling
- Mobile-first responsive design

### Database
- SQLite with better-sqlite3 driver
- Use prepared statements for all queries
- Table naming: snake_case (users, bottle_logs, system_stats)
- Include timestamps and proper constraints

### Hardware/ESP32
- Arduino IDE with C++ syntax
- Pin definitions at top of files
- Sensor calibration functions
- Network communication via HTTP requests

### Sensor Configuration
- **HC-SR04 Ultrasonic Sensor**: 
  - Top sensor for object detection (bottle insertion)
  - Bottom sensor for bin level monitoring (full detection)
- **MG996R Servo Motor**: Bottle sorting/mechanism control
- **SparkFun AS7265x Triad Spectroscopy Sensor**: 
  - Plastic material detection and verification
  - Qwiic interface for I2C communication
  - Spectral analysis for material classification

### General
- Comments only for complex logic or hardware-specific details
- Consistent indentation (2 spaces)
- Error logging with console.error for debugging
- Security: validate all inputs, use parameterized queries