#!/bin/bash

# EcoWiFi Server Deployment Script for Orange Pi One
# This script deploys the EcoWiFi server to production on Orange Pi

set -e

echo "🚀 Starting EcoWiFi deployment..."

# Configuration
REMOTE_HOST="root@10.55.11.97"
REMOTE_DIR="/opt/ecowifi-server"
SERVICE_NAME="ecowifi"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the ecowifi-server directory."
    exit 1
fi

# Build the project
print_status "Building the project..."
bun run build

if [ $? -ne 0 ]; then
    print_error "Build failed!"
    exit 1
fi

# Create deployment package
print_status "Creating deployment package..."
tar -czf ecowifi-deploy.tar.gz \
    dist/ \
    public/ \
    package.json \
    bun.lock \
    .env.example \
    README.md \
    scripts/

# Copy to remote server
print_status "Copying files to remote server..."
scp ecowifi-deploy.tar.gz $REMOTE_HOST:/tmp/

# Remote deployment commands
ssh $REMOTE_HOST << 'EOF'
set -e

echo "🔧 Setting up EcoWiFi on Orange Pi..."

# Create directories
sudo mkdir -p /opt/ecowifi-server
sudo mkdir -p /var/log/ecowifi
sudo mkdir -p /etc/ecowifi

# Extract deployment package
cd /tmp
tar -xzf ecowifi-deploy.tar.gz
sudo cp -r * /opt/ecowifi-server/

# Set permissions
sudo chown -R root:root /opt/ecowifi-server
sudo chmod +x /opt/ecowifi-server/scripts/*.sh

# Install Bun if not present
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
fi

# Install dependencies
cd /opt/ecowifi-server
bun install --production

# Create environment file
if [ ! -f /etc/ecowifi/.env ]; then
    sudo cp /opt/ecowifi-server/.env.example /etc/ecowifi/.env
    echo "⚙️  Please configure /etc/ecowifi/.env with your settings"
fi

# Create systemd service
sudo tee /etc/systemd/system/ecowifi.service > /dev/null << 'EOFSERVICE'
[Unit]
Description=EcoWiFi Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ecowifi-server
Environment=NODE_ENV=production
EnvironmentFile=/etc/ecowifi/.env
ExecStart=/usr/local/bin/bun run start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOFSERVICE

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable ecowifi
sudo systemctl start ecowifi

# Check service status
sudo systemctl status ecowifi --no-pager

echo "✅ EcoWiFi deployment completed!"
echo "📊 Check logs with: journalctl -u ecowifi -f"
echo "🔧 Configure settings in: /etc/ecowifi/.env"
EOF

# Cleanup
print_status "Cleaning up..."
rm ecowifi-deploy.tar.gz

print_status "Deployment completed successfully!"
print_warning "Remember to:"
echo "  1. Configure /etc/ecowifi/.env on the remote server"
echo "  2. Set up Mikrotik router integration"
echo "  3. Configure ESP32 sensor communication"
echo "  4. Test the captive portal functionality"

print_status "Service status check:"
ssh $REMOTE_HOST "systemctl status ecowifi --no-pager -l"