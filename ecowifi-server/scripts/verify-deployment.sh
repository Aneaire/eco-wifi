#!/bin/bash

# RecyFi Deployment Verification Script
# Tests both backend API and frontend connectivity

set -e

# Configuration
API_URL="https://recyfi.vercel.app"
MIKROTIK_HOST="10.56.13.214"
FRONTEND_URL="http://$MIKROTIK_HOST/deposit.html"

echo "🔍 Verifying RecyFi deployment..."
echo "================================"

# Test Backend Health
echo "📊 Testing Backend API..."
if curl -s --connect-timeout 10 "$API_URL/health" | grep -q "ok"; then
    echo "✅ Backend API is healthy"
else
    echo "❌ Backend API is not responding"
    exit 1
fi

# Test API Endpoints
echo "🔌 Testing API endpoints..."

# Test bottle status endpoint
if curl -s "$API_URL/api/bottle/status" | grep -q "bottleDetected"; then
    echo "✅ Bottle status endpoint working"
else
    echo "❌ Bottle status endpoint failed"
fi

# Test stats endpoint
if curl -s "$API_URL/api/stats/dashboard" | grep -q "totalBottles"; then
    echo "✅ Stats dashboard endpoint working"
else
    echo "❌ Stats dashboard endpoint failed"
fi

# Test Frontend (if accessible)
echo "🌐 Testing Frontend..."
if curl -s --connect-timeout 5 "$FRONTEND_URL" | grep -q "RecyFi"; then
    echo "✅ Frontend is accessible on Mikrotik"
else
    echo "⚠️ Frontend not accessible (may be network issue)"
fi

# Test Database Connectivity
echo "🗄️ Testing Database..."
DB_HEALTH=$(curl -s "$API_URL/health" | grep -o '"architecture":"[^"]*"' | cut -d'"' -f4)
if [[ "$DB_HEALTH" == "hybrid-mikrotik-render" ]]; then
    echo "✅ Database architecture confirmed"
else
    echo "❌ Database architecture mismatch"
fi

# Test Mikrotik Connectivity (optional)
echo "📡 Testing Mikrotik Router..."
if ping -c 1 -W 3 "$MIKROTIK_HOST" >/dev/null 2>&1; then
    echo "✅ Mikrotik router is reachable"
else
    echo "❌ Mikrotik router is not reachable"
fi

echo "================================"
echo "🎉 Deployment verification complete!"
echo ""
echo "📊 Dashboard: $API_URL/api/stats/dashboard"
echo "🌐 Frontend: $FRONTEND_URL"
echo "📝 Logs: Check Render dashboard for detailed logs"