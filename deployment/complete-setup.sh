#!/bin/bash

# 🚀 Complete Automated Setup Script
# This script runs all setup steps in sequence
# Usage: ./complete-setup.sh

set -e

echo "=========================================="
echo "🚀 Earnings App - Complete Setup"
echo "=========================================="
echo ""
echo "This script will:"
echo "  1. Setup server (Node.js, PostgreSQL, Redis, PM2, Nginx)"
echo "  2. Setup databases"
echo "  3. Install dependencies"
echo "  4. Build applications"
echo "  5. Seed databases"
echo "  6. Create PM2 config"
echo "  7. Start services"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Step 1: Server Setup
echo ""
echo "=========================================="
echo "Step 1: Server Setup"
echo "=========================================="
bash "$SCRIPT_DIR/vps-setup.sh"

# Step 2: Database Setup
echo ""
echo "=========================================="
echo "Step 2: Database Setup"
echo "=========================================="
echo "You need to run this manually to enter database password:"
echo "  cd deployment && bash setup-databases.sh"
echo ""
read -p "Have you already setup databases? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please run: cd deployment && bash setup-databases.sh"
    echo "Then run this script again."
    exit 1
fi

# Step 3: Check if repository is cloned
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo ""
    echo "=========================================="
    echo "Repository Check"
    echo "=========================================="
    echo "Please clone your repository first:"
    echo "  git clone <your-repo-url> EarningsApp"
    echo "  cd EarningsApp"
    echo "Then run this script again."
    exit 1
fi

# Step 4: Check environment files
echo ""
echo "=========================================="
echo "Environment Files Check"
echo "=========================================="
MISSING_ENV=false

if [ ! -f "backend/gateway/.env" ]; then
    echo "⚠️  Missing: backend/gateway/.env"
    MISSING_ENV=true
fi

if [ ! -f "backend/authservice2/.env" ]; then
    echo "⚠️  Missing: backend/authservice2/.env"
    MISSING_ENV=true
fi

if [ ! -f "backend/adminservice/.env" ]; then
    echo "⚠️  Missing: backend/adminservice/.env"
    MISSING_ENV=true
fi

if [ "$MISSING_ENV" = true ]; then
    echo ""
    echo "Please create .env files before continuing."
    echo "See HOSTINGER_VPS_DEPLOYMENT.md for details."
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 5: Install and Build
echo ""
echo "=========================================="
echo "Step 3: Install Dependencies & Build"
echo "=========================================="
bash "$SCRIPT_DIR/install-and-build.sh"

# Step 6: Seed Databases
echo ""
echo "=========================================="
echo "Step 4: Seed Databases"
echo "=========================================="
bash "$SCRIPT_DIR/seed-databases.sh"

# Step 7: Create PM2 Config
echo ""
echo "=========================================="
echo "Step 5: Create PM2 Config"
echo "=========================================="
bash "$SCRIPT_DIR/create-pm2-config.sh"

# Step 8: Start Services
echo ""
echo "=========================================="
echo "Step 6: Start Services"
echo "=========================================="
read -p "Start services now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    bash "$SCRIPT_DIR/start-services.sh"
    
    echo ""
    echo "=========================================="
    echo "✅ Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Your application should now be running!"
    echo ""
    echo "Check status:"
    echo "  pm2 status"
    echo ""
    echo "View logs:"
    echo "  pm2 logs"
    echo ""
    echo "Test endpoints:"
    echo "  curl http://localhost:3000"
    echo "  curl http://localhost:3001/api"
    echo "  curl http://localhost:3002/api"
    echo ""
else
    echo "You can start services later with:"
    echo "  bash deployment/start-services.sh"
fi



