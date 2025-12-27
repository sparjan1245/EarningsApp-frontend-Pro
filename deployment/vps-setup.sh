#!/bin/bash

# 🚀 Hostinger VPS Automated Setup Script
# This script automates the initial server setup for Earnings App deployment

set -e  # Exit on any error

echo "=========================================="
echo "🚀 Earnings App VPS Setup Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root (we'll use sudo instead)
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root. It will use sudo when needed."
    exit 1
fi

echo "Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System packages updated"

echo ""
echo "Step 2: Installing build tools..."
sudo apt install -y build-essential curl git
print_success "Build tools installed"

echo ""
echo "Step 3: Installing Node.js 18..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_info "Node.js already installed: $NODE_VERSION"
else
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js installed"
fi

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_success "Node.js version: $NODE_VERSION"
print_success "npm version: $NPM_VERSION"

echo ""
echo "Step 4: Installing PostgreSQL..."
if command -v psql &> /dev/null; then
    print_info "PostgreSQL already installed"
else
    sudo apt install postgresql postgresql-contrib -y
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    print_success "PostgreSQL installed and started"
fi

echo ""
echo "Step 5: Installing Redis..."
if command -v redis-cli &> /dev/null; then
    print_info "Redis already installed"
else
    sudo apt install redis-server -y
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    print_success "Redis installed and started"
fi

# Test Redis
if redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is running"
else
    print_error "Redis is not responding"
fi

echo ""
echo "Step 6: Installing PM2..."
if command -v pm2 &> /dev/null; then
    print_info "PM2 already installed"
else
    sudo npm install -g pm2
    print_success "PM2 installed"
fi

echo ""
echo "Step 7: Installing Nginx..."
if command -v nginx &> /dev/null; then
    print_info "Nginx already installed"
else
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_success "Nginx installed and started"
fi

echo ""
echo "Step 8: Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow OpenSSH
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    echo "y" | sudo ufw --force enable > /dev/null 2>&1
    print_success "Firewall configured"
else
    print_info "UFW not available, skipping firewall setup"
fi

echo ""
echo "=========================================="
print_success "Server setup completed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Setup PostgreSQL databases (run: ./setup-databases.sh)"
echo "2. Clone your repository"
echo "3. Configure environment variables"
echo "4. Install dependencies and build"
echo ""
echo "For detailed instructions, see: HOSTINGER_VPS_DEPLOYMENT.md"



