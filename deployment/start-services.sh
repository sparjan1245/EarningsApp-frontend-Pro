#!/bin/bash

# 🚀 Start Services Script
# This script starts all services using PM2

set -e

echo "=========================================="
echo "🚀 Start Services Script"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if ecosystem.config.js exists
if [ ! -f "ecosystem.config.js" ]; then
    print_error "ecosystem.config.js not found!"
    print_info "Run ./create-pm2-config.sh first"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed!"
    print_info "Install it with: sudo npm install -g pm2"
    exit 1
fi

echo "Starting all services with PM2..."
pm2 start ecosystem.config.js

echo ""
echo "Waiting 5 seconds for services to start..."
sleep 5

echo ""
echo "Checking service status..."
pm2 status

echo ""
echo "Saving PM2 configuration..."
pm2 save

echo ""
print_info "To setup PM2 to start on boot, run:"
echo "  pm2 startup"
echo "  (Then copy and run the command it outputs)"
echo ""

echo "=========================================="
print_success "Services started!"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check service status"
echo "  pm2 logs            - View all logs"
echo "  pm2 logs gateway    - View gateway logs"
echo "  pm2 restart all     - Restart all services"
echo "  pm2 stop all        - Stop all services"
echo ""



