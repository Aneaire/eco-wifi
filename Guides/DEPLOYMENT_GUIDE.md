# RecyFi Hybrid Architecture Deployment Guide

## 🏗️ Architecture Overview

The new RecyFi system uses a hybrid architecture:
- **Frontend**: Static files hosted on Mikrotik router (~100KB)
- **Backend**: API server on Render.com with Turso SQLite database
- **Runtime**: Bun + Hono + Drizzle ORM

## 📋 Prerequisites

### Required Accounts
- [Turso Database](https://turso.tech) account
- [Render.com](https://render.com) account
- Access to Mikrotik router (10.56.13.214)

### Required Tools
- Bun runtime: `curl -fsSL https://bun.sh/install | bash`
- Turso CLI: `bun add -g @tursodatabase/turso`
- Git

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

**Save the URL and token for Render configuration.**

### 2. Backend Deployment to Render.com

```bash
# Clone and setup
git clone <your-repo>
cd ecowifi-server

# Install dependencies
bun install

# Set environment variables
export TURSO_URL="libsql://recyfi-db.turso.io"
export TURSO_TOKEN="your-token-here"

# Generate migrations
bun run db:generate

# Test locally
bun run dev
```

**Deploy to Render:**
1. Push code to GitHub repository
2. Connect repository to Render.com
3. Use `render.yaml` configuration
4. Set environment variables in Render dashboard:
   - `TURSO_URL`: Your Turso database URL
   - `TURSO_TOKEN`: Your Turso auth token
   - `MIKROTIK_HOST`: 10.56.13.214
   - `MIKROTIK_USER`: admin
   - `MIKROTIK_PASS`: ken
   - `MIKROTIK_PROFILE`: 5min-access

### 3. Frontend Deployment to Mikrotik

```bash
# Deploy frontend files to Mikrotik
cd ecowifi-server
./scripts/deploy-mikrotik.sh
```

**Manual Mikrotik Configuration:**
1. Access WinBox at `10.56.13.214`
2. Navigate to IP → Hotspot
3. Set `html-directory=hotspot`
4. Configure walled garden for `recyfi.onrender.com`
5. Set login redirect to `/deposit.html`

### 4. Database Migration

```bash
# Run migrations on production
# Render will automatically run migrations on deploy
# Or manually via Render shell:
bun run db:migrate
```

## 🔧 Configuration Files

### Environment Variables (.env)
```bash
# Production
TURSO_URL=libsql://recyfi-db.turso.io
TURSO_TOKEN=your-auth-token
NODE_ENV=production
PORT=3000

# Mikrotik Settings
MIKROTIK_HOST=10.56.13.214
MIKROTIK_USER=admin
MIKROTIK_PASS=ken
MIKROTIK_PROFILE=5min-access
```

### Render Configuration (render.yaml)
Already configured in the repository. Just connect your repo to Render.

## 🧪 Testing

### Local Testing
```bash
# Start backend
bun run dev

# Test API
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/bottle/deposit \
  -H "Content-Type: application/json" \
  -d '{"macAddress":"TEST-MAC"}'
```

### Production Testing
```bash
# Test backend
curl https://recyfi.onrender.com/health

# Test frontend (from Mikrotik network)
curl http://10.56.13.1/deposit.html
```

## 📊 Monitoring

### Backend Health
- Health endpoint: `https://recyfi.onrender.com/health`
- Render logs: Available in Render dashboard
- Database stats: Turso dashboard

### Frontend Status
- Access via: `http://10.56.13.1/deposit.html`
- Check Mikrotik hotspot status in WinBox

## 🔒 Security Considerations

### API Security
- CORS configured for Mikrotik access
- Rate limiting on endpoints
- Input validation and sanitization

### Database Security
- Turso authentication tokens
- Encrypted connections (HTTPS)
- Regular backups via Turso

### Mikrotik Security
- SSH key authentication recommended
- Firewall rules for API access
- Regular password updates

## 🚨 Troubleshooting

### Common Issues

#### Backend Not Starting
```bash
# Check logs in Render dashboard
# Verify environment variables
# Test database connection
```

#### Frontend Not Loading
```bash
# Check Mikrotik file storage
# Verify hotspot configuration
# Test network connectivity
```

#### Database Connection Issues
```bash
# Verify Turso URL and token
# Check database location
# Test with local SQLite first
```

### Debug Commands
```bash
# Local debugging
DEBUG=recyfi:* bun run dev

# Database debugging
bun run db:studio

# Migration debugging
bun run db:push --force
```

## 📈 Performance Optimization

### Backend
- Use Render's free tier (512MB RAM)
- Enable caching in Turso
- Monitor response times

### Frontend
- Compress images (already done)
- Minimize JavaScript (single file)
- Use Mikrotik's built-in HTTP server

### Database
- Index critical columns
- Archive old data periodically
- Monitor query performance

## 🔄 Maintenance

### Regular Tasks
- Update dependencies monthly
- Review and rotate API tokens
- Monitor database storage usage
- Check Mikrotik storage space

### Backup Strategy
- Turso: Automatic backups
- Frontend: Version control
- Config: Document settings

## 📞 Support

### Resources
- [Turso Documentation](https://docs.turso.tech)
- [Render Documentation](https://render.com/docs)
- [Mikrotik Documentation](https://wiki.mikrotik.com)

### Emergency Contacts
- System administrator for Mikrotik access
- Database admin for Turso issues
- DevOps for Render problems

---

**Deployment Status**: ✅ Ready for production deployment
**Next Steps**: Deploy to Render.com, then upload frontend to Mikrotik