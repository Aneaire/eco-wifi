#!/bin/bash

# RecyFi Frontend Deployment Script for Mikrotik Router
# This script uploads frontend files to the Mikrotik hotspot directory

set -e

# Configuration
MIKROTIK_HOST="10.56.13.214"
MIKROTIK_USER="admin"
MIKROTIK_PASS="ken"
FRONTEND_DIR="./public"
REMOTE_DIR="/hotspot"

echo "🚀 Deploying RecyFi frontend to Mikrotik router..."

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

# Create remote directory if it doesn't exist
echo "📁 Creating hotspot directory on Mikrotik..."
sshpass -p "$MIKROTIK_PASS" ssh -o StrictHostKeyChecking=no "$MIKROTIK_USER@$MIKROTIK_HOST" "/file make-directory $REMOTE_DIR" || echo "Directory may already exist"

# Upload files
echo "📤 Uploading frontend files..."

# Upload HTML files
echo "  - Uploading HTML files..."
sshpass -p "$MIKROTIK_PASS" scp -o StrictHostKeyChecking=no "$FRONTEND_DIR"/*.html "$MIKROTIK_USER@$MIKROTIK_HOST:$REMOTE_DIR/"

# Upload JavaScript files
echo "  - Uploading JavaScript files..."
sshpass -p "$MIKROTIK_PASS" scp -o StrictHostKeyChecking=no -r "$FRONTEND_DIR/js" "$MIKROTIK_USER@$MIKROTIK_HOST:$REMOTE_DIR/"

# Upload image files
echo "  - Uploading image files..."
sshpass -p "$MIKROTIK_PASS" scp -o StrictHostKeyChecking=no ../image/earth_compact.jpg "$MIKROTIK_USER@$MIKROTIK_HOST:$REMOTE_DIR/"
sshpass -p "$MIKROTIK_PASS" scp -o StrictHostKeyChecking=no ../image/earth_compact.png "$MIKROTIK_USER@$MIKROTIK_HOST:$REMOTE_DIR/"

# Configure Mikrotik hotspot to use the uploaded files
echo "⚙️ Configuring Mikrotik hotspot..."
sshpass -p "$MIKROTIK_PASS" ssh -o StrictHostKeyChecking=no "$MIKROTIK_USER@$MIKROTIK_HOST" "/ip hotspot set [find] html-directory=$REMOTE_DIR"

# Set the login redirect to deposit.html
echo "🔗 Setting login redirect..."
sshpass -p "$MIKROTIK_PASS" ssh -o StrictHostKeyChecking=no "$MIKROTIK_USER@$MIKROTIK_HOST" "/ip hotspot walled-garden ip add address=recyfi.onrender.com"

echo "✅ Frontend deployment completed!"
echo "🌐 Access the portal at: http://10.56.13.1/deposit.html"
echo "📊 API endpoint: https://recyfi.onrender.com"

# Test connectivity
echo "🧪 Testing connectivity..."
if curl -s --connect-timeout 5 "http://$MIKROTIK_HOST/deposit.html" > /dev/null; then
    echo "✅ Frontend is accessible!"
else
    echo "❌ Frontend not accessible. Check Mikrotik configuration."
fi