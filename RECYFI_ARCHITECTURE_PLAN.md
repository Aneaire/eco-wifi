# RecyFi System Architecture Plan

## Overview
Refactor the RecyFi WiFi hotspot system to use a hybrid architecture:
- **Frontend**: Hosted locally on Mikrotik router (static HTML/CSS/JS)
- **Backend API**: External server on Render.com with Turso SQLite database
- **Runtime**: Bun + Hono + Drizzle ORM

## Current State Analysis
- **Frontend Size**: ~32KB (HTML files) + 50KB (compressed image) = ~82KB total
- **Mikrotik Resources**: 7.8MiB free storage, 32MiB RAM (sufficient for static serving)
- **Database**: In-memory JSON (to be migrated to Turso)
- **Deployment**: Local Orange Pi server (to be decommissioned)

## New Architecture

### Frontend (Mikrotik Router)
- **Location**: `/hotspot/` directory on Mikrotik
- **Files**:
  - `index.html` - Main landing page
  - `deposit.html` - Plastic deposit interface
  - `earth_compact.jpg` - Compressed hero image (50KB)
- **Serving**: Mikrotik built-in HTTP server
- **Access**: `http://10.56.13.1/deposit.html` via hotspot redirect
- **Updates**: Manual FTP upload when needed

### Backend (Render.com)
- **Framework**: Hono with Bun runtime
- **Database**: Turso SQLite (distributed, HTTP-based)
- **ORM**: Drizzle for type-safe queries
- **Endpoints**:
  - `POST /api/bottle/deposit` - Process plastic deposits
  - `GET /api/bottle/status` - Check bottle detection
  - `GET /api/user/session/:mac` - User session info
  - `GET /api/stats/dashboard` - System statistics
- **Domain**: `https://recyfi.onrender.com`
- **Environment Variables**:
  - `TURSO_URL` - Database connection URL
  - `TURSO_TOKEN` - Authentication token
  - `PORT` - Render-provided port

### Database Schema (Turso + Drizzle)
```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  mac_address TEXT UNIQUE NOT NULL,
  session_start TEXT,
  session_end TEXT,
  bottles_deposited INTEGER DEFAULT 0
);

-- Bottle logs table
CREATE TABLE bottles (
  id INTEGER PRIMARY KEY,
  timestamp TEXT NOT NULL,
  material_confirmed BOOLEAN DEFAULT FALSE,
  mac_address TEXT NOT NULL
);

-- Daily stats table
CREATE TABLE stats (
  id INTEGER PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  total_bottles INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0
);
```

## Implementation Steps

### 1. Turso Database Setup
- Create Turso account at https://turso.tech
- Initialize new database: `turso db create recyfi-db`
- Get database URL and auth token
- Install Turso CLI: `bun add -g @tursodatabase/turso`

### 2. Drizzle ORM Integration
- Install dependencies:
  ```bash
  bun add drizzle-orm @tursodatabase/api
  bun add -d drizzle-kit
  ```
- Create schema file: `src/schema.ts`
- Create database client: `src/db.ts`
- Generate migrations: `bun drizzle-kit generate`

### 3. Backend Refactoring
- Update `src/database.ts` → `src/db.ts` with Drizzle queries
- Modify routes to use async database operations
- Add CORS middleware for Mikrotik access
- Remove static file serving (handled by Mikrotik)

### 4. Frontend Updates
- Update API calls to use absolute URLs:
  ```javascript
  fetch('https://recyfi.onrender.com/api/bottle/deposit', ...)
  ```
- Ensure mobile responsiveness
- Add error handling for network issues

### 5. Render.com Deployment
- Create `Dockerfile` for Bun runtime:
  ```dockerfile
  FROM oven/bun:latest
  WORKDIR /app
  COPY package.json bun.lockb ./
  RUN bun install
  COPY . .
  EXPOSE 3000
  CMD ["bun", "run", "src/index.ts"]
  ```
- Create `render.yaml` service configuration
- Set environment variables in Render dashboard
- Deploy and test

### 6. Mikrotik Configuration
- Upload frontend files to `/hotspot/` directory
- Configure hotspot profile: `html-directory=hotspot`
- Set login redirect to `/deposit.html`
- Add walled garden rules for Render domain
- Test end-to-end flow

## Benefits

### Advantages
- **Performance**: Faster page loads (local serving)
- **Reliability**: No local hardware dependencies
- **Scalability**: Global database access
- **Cost-Effective**: Free tiers for small scale
- **Security**: HTTPS for API, isolated database
- **Maintenance**: Separate frontend/backend updates

### Resource Optimization
- **Mikrotik**: Minimal storage usage (~100KB)
- **Render**: Stateless API server
- **Database**: Distributed SQLite with automatic backups

## Migration Strategy

### Data Migration
1. Export current in-memory data to JSON
2. Create Turso database schema
3. Import data via Drizzle migrations
4. Validate data integrity

### Testing Plan
1. **Local Testing**: Bun + Turso dev environment
2. **Integration Testing**: API endpoints with frontend
3. **End-to-End Testing**: Complete user flow
4. **Load Testing**: Multiple concurrent users

### Rollback Plan
- Keep current system as backup during transition
- Monitor performance and errors
- Quick rollback via Mikrotik configuration

## Security Considerations

### API Security
- CORS restrictions to Mikrotik IP range
- Rate limiting on API endpoints
- Input validation and sanitization
- Environment variable protection

### Database Security
- Turso authentication tokens
- Encrypted connections (HTTPS)
- Regular backups via Turso dashboard

## Monitoring & Maintenance

### Monitoring
- Render application logs
- Turso database metrics
- Mikrotik hotspot statistics
- API response times

### Maintenance
- Regular dependency updates
- Database schema migrations
- Frontend content updates
- Performance optimization

## Cost Analysis

### Free Tier Limits
- **Turso**: 500 databases, 1GB storage, 500M reads/month
- **Render**: 750 hours/month, 512MB RAM, shared CPU
- **Mikrotik**: No additional cost

### Scaling Costs
- **Turso**: $0.001 per 1K reads beyond free tier
- **Render**: $7/month for additional resources
- **Total**: Minimal cost for small-scale deployment

## Timeline

### Phase 1: Database Setup (1-2 days)
- Turso account creation
- Schema definition
- Initial data migration

### Phase 2: Backend Development (2-3 days)
- Drizzle integration
- API refactoring
- Local testing

### Phase 3: Deployment (1-2 days)
- Render configuration
- Frontend upload
- End-to-end testing

### Phase 4: Migration (1 day)
- Production deployment
- Monitoring setup
- Documentation updates

## Success Metrics

### Performance
- Page load time < 2 seconds
- API response time < 500ms
- 99% uptime for API endpoints

### Functionality
- Complete user flow working
- Data persistence across sessions
- Mobile device compatibility

### Scalability
- Support for 100+ concurrent users
- Database performance under load
- Easy feature additions

---

**Status**: Ready for implementation
**Next Step**: Create Turso database and set up Drizzle ORM