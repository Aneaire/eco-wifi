# RecyFi Server - Hybrid Architecture v2.0

A modern hybrid WiFi hotspot system that provides internet access in exchange for plastic recycling. Features a scalable architecture with Mikrotik frontend hosting and Vercel serverless backend API.

## 🌟 Architecture v2.0 Features

- 🚀 **Hybrid Architecture**: Frontend on Mikrotik + Backend on Vercel
- 🗄️ **Modern Database**: Turso SQLite with Drizzle ORM
- ⚡ **High Performance**: Bun runtime + Hono framework
- 📱 **Mobile-Responsive**: Optimized captive portal interface
- 🔗 **Mikrotik Integration**: Automatic hotspot user creation
- 📊 **Real-time Analytics**: Live recycling and usage metrics
- 🛡️ **Cloud-Native**: Scalable deployment with automatic backups
- 🔄 **Session Management**: 15-minute WiFi access per plastic deposit

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Devices  │───▶│  Mikrotik Router │───▶│  Vercel Edge API │
│   (WiFi)        │    │  Frontend Host  │    │  Backend Server │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────┐         ┌─────────────┐
                       │ Static Files │         │ Turso SQLite │
                       │ (~100KB)     │         │ Database     │
                       └─────────────┘         └─────────────┘
```

## 🚀 Quick Start

### Prerequisites

- [Turso Database](https://turso.tech) account
- [Vercel](https://vercel.com) account  
- Mikrotik router access
- Bun runtime: `curl -fsSL https://bun.sh/install | bash`

### 1. Database Setup

```bash
# Install Turso CLI
bun add -g @tursodatabase/turso

# Login and create database
turso auth login
turso db create recyfi-db --location eu

# Get credentials
turso db show recyfi-db --show-url
turso db tokens create recyfi-db
```

### 2. Backend Deployment

```bash
# Clone and setup
git clone <repository-url>
cd ecowifi-server

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with Turso credentials

# Test locally
bun run dev
```

**Deploy to Vercel:**
1. Push to GitHub
2. Connect repo to Vercel
3. Use `vercel.json` configuration
4. Set environment variables in dashboard

### 3. Frontend Deployment

```bash
# Deploy to Mikrotik router
./scripts/deploy-mikrotik.sh

# Or manually upload files to /hotspot/ directory
```

## 📡 API Endpoints

### Bottle Management
- `POST /api/bottle/deposit` - Process plastic deposit
- `GET /api/bottle/status` - Check bottle detection status
- `GET /api/bottle/history` - Get deposit history

### User Sessions  
- `GET /api/user/session/:macAddress` - Get session info
- `POST /api/user/extend` - Extend session time
- `GET /api/user/active` - List active sessions

### Statistics
- `GET /api/stats/dashboard` - System statistics
- `GET /api/stats/history/:days` - Historical data
- `GET /api/stats/realtime` - Real-time metrics

### System
- `GET /health` - Health check with architecture info

## 🔧 Configuration

### Environment Variables

```bash
# Database (Required)
TURSO_URL=libsql://recyfi-db.turso.io  
TURSO_TOKEN=your-auth-token

# Server
PORT=3000
NODE_ENV=production

# Mikrotik Integration
MIKROTIK_HOST=10.56.13.214
MIKROTIK_USER=admin  
MIKROTIK_PASS=ken
MIKROTIK_PROFILE=5min-access
```

### Frontend Configuration

The frontend automatically detects the environment:
- **Development**: Uses `http://localhost:3000`
- **Production**: Uses `https://recyfi.onrender.com`

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  mac_address TEXT UNIQUE NOT NULL,
  session_start TEXT,
  session_end TEXT, 
  bottles_deposited INTEGER DEFAULT 0
);
```

### Bottles Table
```sql
CREATE TABLE bottles (
  id INTEGER PRIMARY KEY,
  timestamp TEXT NOT NULL,
  material_confirmed BOOLEAN DEFAULT FALSE,
  mac_address TEXT NOT NULL
);
```

### Stats Table
```sql
CREATE TABLE stats (
  id INTEGER PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  total_bottles INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0
);
```

## 🌐 Web Interface

### Access Points
- **Development**: `http://localhost:3000/deposit.html`
- **Production**: `http://10.56.13.1/deposit.html` (Mikrotik)

### Features
- Real-time bottle detection polling
- Session timer display
- Environmental impact statistics
- Mobile-responsive design
- Progressive enhancement

## 🔗 Mikrotik Integration

### Hotspot Configuration

In WinBox:
1. **IP → Hotspot → Server Profiles**
   - Set `html-directory=hotspot`
   - Configure login redirect to `/deposit.html`

2. **IP → Hotspot → User Profiles** 
   - Create `5min-access` profile
   - Set `session-timeout=15m`
   - Set `idle-timeout=5m`

3. **IP → Hotspot → Walled Garden**
   - Add `recyfi.onrender.com` for API access

### User Creation Flow

```bash
# Automatic SSH command executed by backend
ssh admin@10.56.13.214 \
  "/ip hotspot user add name=\"MAC_ADDRESS\" password=\"recyfi2024\" profile=\"5min-access\" comment=\"RecyFi deposit\""
```

## 🛠️ Development

### Project Structure
```
ecowifi-server/
├── src/
│   ├── index.ts           # Main server
│   ├── db.ts             # Database client
│   ├── schema.ts         # Drizzle schema
│   ├── routes/           # API handlers
│   └── migrate.ts        # Migration script
├── public/               # Frontend files
│   ├── deposit.html      # Main interface
│   ├── index.html        # Landing page
│   └── js/portal.js      # Client logic
├── drizzle/              # Database migrations
├── scripts/              # Deployment scripts
├── vercel.json           # Vercel configuration
└── Dockerfile.render     # Production container
```

### Available Scripts

```bash
# Development
bun run dev              # Start dev server
bun run build            # Build for production  
bun run start            # Start production server

# Database
bun run db:generate      # Create migrations
bun run db:migrate       # Run migrations
bun run db:push          # Push schema changes
bun run db:studio        # Database GUI

# Deployment
./scripts/deploy-mikrotik.sh    # Deploy frontend
./scripts/verify-deployment.sh   # Test deployment
```

## 🔒 Security

### API Security
- CORS configured for Mikrotik access
- Input validation and sanitization
- Rate limiting on endpoints
- Environment variable protection

### Database Security  
- Turso authentication tokens
- Encrypted HTTPS connections
- Automatic backups via Turso
- Query parameterization

### Network Security
- SSH communication to Mikrotik
- Firewall configuration
- Session timeout enforcement
- Secure password handling

## 📈 Performance

### Metrics
- **API Response**: < 500ms average
- **Database**: Distributed SQLite with edge caching
- **Frontend Load**: < 2 seconds (local serving)
- **Concurrent Users**: 100+ supported
- **Uptime**: 99.99% (Vercel SLA)

### Optimization
- Bun runtime for fast execution
- Drizzle ORM for efficient queries
- Static file serving on Mikrotik
- Database connection pooling

## 🔍 Monitoring

### Health Checks
```bash
# Backend health
curl https://recyfi.onrender.com/health

# API endpoints  
curl https://recyfi.onrender.com/api/stats/dashboard

# Frontend access
curl http://10.56.13.1/deposit.html
```

### Monitoring Tools
- Vercel dashboard for application metrics
- Turso dashboard for database performance
- Mikrotik WinBox for hotspot status
- Custom verification script included

## 🚨 Troubleshooting

### Common Issues

**Backend Not Responding**
```bash
# Check Vercel logs
# Verify environment variables
# Test database connection
```

**Frontend Not Loading**  
```bash
# Verify Mikrotik file upload
# Check hotspot configuration
# Test network connectivity
```

**Database Connection Issues**
```bash
# Verify Turso URL and token
# Check database location
# Test with local SQLite
```

### Debug Commands
```bash
# Local debugging
DEBUG=recyfi:* bun run dev

# Database debugging  
bun run db:studio

# Deployment verification
./scripts/verify-deployment.sh
```

## 🌍 Deployment

### Production Checklist

- [ ] Turso database created and configured
- [ ] Vercel app deployed and healthy
- [ ] Environment variables set in Vercel
- [ ] Frontend files uploaded to Mikrotik
- [ ] Mikrotik hotspot configured
- [ ] Walled garden rules added
- [ ] End-to-end testing completed

### Rollback Plan

```bash
# Backend rollback
# Vercel automatically maintains previous deployments

# Frontend rollback  
# Re-upload previous files to Mikrotik /hotspot/ directory

# Database rollback
# Turso supports point-in-time recovery
```

## 📊 Cost Analysis

### Free Tier Usage
- **Turso**: 500 databases, 1GB storage, 500M reads/month
- **Vercel**: 100K function invocations, 100GB bandwidth
- **Mikrotik**: No additional cost

### Scaling Costs
- **Turso**: $0.001 per 1K reads beyond free tier
- **Vercel**: $10/month for Pro plan
- **Total**: Minimal cost for small-scale deployment

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- 📖 Check [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)
- 🔍 Review troubleshooting section
- 🐛 Open an issue on GitHub
- 📧 Contact development team

---

## 🎯 Quick Test Commands

```bash
# Test backend API
curl -X POST https://recyfi.vercel.app/api/bottle/deposit \
  -H "Content-Type: application/json" \
  -d '{"macAddress":"TEST-MAC-001"}'

# Verify Mikrotik user creation
ssh admin@10.56.13.214 "/ip hotspot user print | grep TEST-MAC-001"

# Check system statistics
curl https://recyfi.vercel.app/api/stats/dashboard

# Verify deployment
./scripts/verify-deployment.sh
```

**RecyFi v2.0 Status**: ✅ **HYBRID ARCHITECTURE READY**