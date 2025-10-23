# RecyFi Vercel Deployment Guide

## 🚀 Vercel + Turso + Mikrotik Architecture

Deploy RecyFi using Vercel's serverless functions with Turso database and Mikrotik frontend hosting.

## 📋 Prerequisites

### Required Accounts
- [Vercel](https://vercel.com) account (GitHub login works)
- [Turso Database](https://turso.tech) account
- Access to Mikrotik router (10.56.13.214)

### Required Tools
- Node.js/Bun runtime
- Git repository
- Vercel CLI (optional): `npm i -g vercel`

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Devices  │───▶│  Mikrotik Router │───▶│   Vercel Edge   │
│   (WiFi)        │    │  Frontend Host  │    │  Serverless API │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────┐         ┌─────────────┐
                       │ Static Files │         │ Turso SQLite │
                       │ (~100KB)     │         │ Database     │
                       └─────────────┘         └─────────────┘
```

## 🚀 Deployment Steps

### 1. Turso Database Setup

```bash
# Install Turso CLI
bun add -g @tursodatabase/turso

# Login to Turso
turso auth login

# Create database
turso db create recyfi-db --location eu

# Get database URL and token
turso db show recyfi-db --show-url
turso db tokens create recyfi-db
```

**Save the URL and token for Vercel configuration.**

### 2. Vercel Project Setup

#### Option A: Via Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Framework preset: "Other"

2. **Configure Environment Variables**
   ```
   TURSO_URL=libsql://recyfi-db.turso.io
   TURSO_TOKEN=your-auth-token-here
   MIKROTIK_HOST=10.56.13.214
   MIKROTIK_USER=admin
   MIKROTIK_PASS=ken
   MIKROTIK_PROFILE=5min-access
   ```

3. **Build Settings**
   - Build Command: `bun run vercel-build`
   - Output Directory: `public`
   - Install Command: `bun install`

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
cd ecowifi-server
vercel

# Follow prompts to configure project
# Set environment variables when asked
```

### 3. Database Migration

Vercel automatically runs `vercel-build` which generates migrations. For manual migration:

```bash
# Generate migrations locally
bun run db:generate

# Push schema to Turso
bun run db:push
```

### 4. Frontend Deployment to Mikrotik

```bash
# Deploy frontend files to Mikrotik
cd ecowifi-server
./scripts/deploy-mikrotik.sh
```

**Manual Upload:**
1. Copy files from `public/` to Mikrotik `/hotspot/` directory
2. Configure hotspot: `html-directory=hotspot`
3. Set walled garden for `recyfi.vercel.app`

## 🔧 Configuration Files

### Vercel Configuration (vercel.json)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.ts",
      "use": "@vercel/node"
    },
    {
      "src": "public/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

### Environment Variables
Set these in Vercel dashboard under Project Settings → Environment Variables:

```bash
# Database (Required)
TURSO_URL=libsql://recyfi-db.turso.io
TURSO_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mikrotik Settings
MIKROTIK_HOST=10.56.13.214
MIKROTIK_USER=admin
MIKROTIK_PASS=ken
MIKROTIK_PROFILE=5min-access
```

## 📡 API Endpoints (Vercel Serverless)

### Bottle Management
- `POST /api/bottle/deposit` - Process plastic deposit
- `GET /api/bottle/status` - Check bottle detection
- `GET /api/bottle/history` - Get deposit history

### User Sessions
- `GET /api/user/session/[macAddress]` - Get session info
- `POST /api/user/extend` - Extend session
- `GET /api/user/active` - List active sessions

### Statistics
- `GET /api/stats/dashboard` - System stats
- `GET /api/stats/history/[days]` - Historical data
- `GET /api/stats/realtime` - Real-time metrics

### System
- `GET /api/health` - Health check

## 🌐 Frontend Configuration

The frontend automatically detects the environment:
- **Development**: Uses `http://localhost:3000`
- **Production**: Uses `https://recyfi.vercel.app`

### Access Points
- **Development**: `http://localhost:3000/deposit.html`
- **Production**: `http://10.56.13.1/deposit.html` (Mikrotik)

## 🧪 Testing

### Local Testing
```bash
# Test serverless functions locally
vercel dev

# Test API endpoints
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/bottle/deposit \
  -H "Content-Type: application/json" \
  -d '{"macAddress":"TEST-MAC"}'
```

### Production Testing
```bash
# Test deployed API
curl https://recyfi.vercel.app/api/health

# Test frontend (from Mikrotik network)
curl http://10.56.13.1/deposit.html
```

## 📊 Monitoring

### Vercel Dashboard
- Function execution logs
- Performance metrics
- Error tracking
- Usage analytics

### Database Monitoring
- Turso dashboard for database metrics
- Query performance
- Storage usage

### Verification Script
```bash
# Test complete deployment
./scripts/verify-deployment.sh
```

## 🔒 Security

### Vercel Security
- Automatic HTTPS
- Edge network security
- Environment variable protection
- Function isolation

### Database Security
- Turso authentication tokens
- Encrypted connections
- Query parameterization

### Mikrotik Security
- SSH communication
- Firewall configuration
- Session timeout enforcement

## 🚨 Troubleshooting

### Common Issues

#### Function Timeout
```json
// In vercel.json, increase timeout
"functions": {
  "api/**/*.ts": {
    "maxDuration": 30
  }
}
```

#### Database Connection
```bash
# Verify Turso credentials
turso db show recyfi-db --show-url
turso db tokens create recyfi-db

# Test connection locally
TURSO_URL=libsql://... TURSO_TOKEN=... bun run dev
```

#### Frontend Not Loading
```bash
# Check Mikrotik file upload
# Verify hotspot configuration
# Test network connectivity
```

### Debug Commands
```bash
# Local development with debugging
vercel dev --debug

# Check function logs
vercel logs

# Database debugging
bun run db:studio
```

## 📈 Performance

### Vercel Edge Benefits
- **Global CDN**: Automatic edge deployment
- **Cold Starts**: < 100ms for TypeScript functions
- **Scalability**: Auto-scaling with demand
- **Reliability**: 99.99% uptime SLA

### Optimization Tips
- Keep functions lightweight
- Use edge-optimized database (Turso)
- Implement proper caching
- Monitor function duration

## 💰 Cost Analysis

### Vercel Free Tier
- **Functions**: 100K invocations/month
- **Bandwidth**: 100GB/month
- **Builds**: 120 builds/month
- **Duration**: 10s/function max

### Turso Free Tier
- **Storage**: 1GB
- **Reads**: 500M/month
- **Writes**: 10M/month
- **Databases**: 500

### Total Cost
- **Small Scale**: $0/month (free tiers)
- **Medium Scale**: ~$10/month (Vercel Pro)
- **Large Scale**: ~$20/month (Vercel Pro + Turso)

## 🔄 CI/CD Integration

### Automatic Deployments
Vercel automatically deploys on:
- Push to main branch
- Pull request previews
- Production deployments

### Environment Management
- **Preview**: Automatic preview URLs for PRs
- **Staging**: Separate staging environment
- **Production**: Optimized production builds

## 🌍 Global Deployment

### Edge Functions
Vercel automatically deploys to:
- US East, US West
- Europe (Frankfurt, Dublin)
- Asia (Singapore, Tokyo)
- Australia (Sydney)

### Database Replication
Turso supports:
- Primary region selection
- Read replicas
- Automatic failover

## 📚 Additional Resources

### Documentation
- [Vercel Functions](https://vercel.com/docs/concepts/functions)
- [Turso Database](https://docs.turso.tech)
- [Mikrotik Hotspot](https://wiki.mikrotik.com/wiki/Manual:Hotspot)

### Examples
- Serverless API patterns
- Database integration
- Edge optimization

---

## 🎯 Quick Deployment Checklist

- [ ] Turso database created
- [ ] Environment variables configured in Vercel
- [ ] Repository connected to Vercel
- [ ] Frontend deployed to Mikrotik
- [ ] Mikrotik hotspot configured
- [ ] End-to-end testing completed
- [ ] Monitoring setup verified

**Vercel Deployment Status**: ✅ **PRODUCTION READY**

**Next Steps**: Deploy to Vercel, then upload frontend to Mikrotik router.