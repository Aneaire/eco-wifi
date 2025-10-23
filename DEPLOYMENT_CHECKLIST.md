# RecyFi Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

### Database Setup
- [x] Turso database created (`recyfi-aneaire`)
- [x] Database credentials in `.env`
- [x] Database tables created with Drizzle schema
- [x] API endpoints tested locally

### Code Ready
- [x] Vercel configuration (`vercel.json`)
- [x] Serverless functions in `api/` directory
- [x] Frontend updated for Vercel URLs
- [x] Environment variables configured

## 🚀 Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Framework preset: "Other"
5. Add environment variables:
   - `TURSO_URL`: `libsql://recyfi-aneaire.aws-ap-northeast-1.turso.io`
   - `TURSO_TOKEN`: `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...`
   - `MIKROTIK_HOST`: `10.56.13.214`
   - `MIKROTIK_USER`: `admin`
   - `MIKROTIK_PASS`: `ken`
   - `MIKROTIK_PROFILE`: `5min-access`

### 3. Deploy Frontend to Mikrotik
```bash
./scripts/deploy-mikrotik.sh
```

## 🧪 Post-Deployment Testing

### API Tests
```bash
# Test health endpoint
curl https://recyfi.vercel.app/api/health

# Test bottle deposit
curl -X POST https://recyfi.vercel.app/api/bottle/deposit \
  -H "Content-Type: application/json" \
  -d '{"macAddress":"VERCEL-TEST-001"}'

# Test stats dashboard
curl https://recyfi.vercel.app/api/stats/dashboard
```

### Frontend Tests
- Access `http://10.56.13.1/deposit.html` from Mikrotik network
- Verify API calls are working
- Test bottle deposit flow

## 📊 Monitoring

### Vercel Dashboard
- Function logs
- Performance metrics
- Error tracking

### Database
- Turso dashboard for database stats
- Query performance

## 🔧 Troubleshooting

### Common Issues
1. **Function Timeout**: Increase `maxDuration` in `vercel.json`
2. **Database Connection**: Verify Turso credentials
3. **CORS Issues**: Check Mikrotik walled garden settings

### Debug Commands
```bash
# Local testing
vercel dev

# Check logs
vercel logs
```

---

## ✅ Ready for Production

Your RecyFi system is ready for Vercel deployment! The architecture includes:

- **Backend**: Vercel serverless functions with Drizzle ORM
- **Database**: Turso SQLite with automatic scaling
- **Frontend**: Static files on Mikrotik router
- **API**: RESTful endpoints with proper error handling

**Expected URL**: `https://recyfi.vercel.app`