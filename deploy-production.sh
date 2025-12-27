#!/bin/bash

# Production Deployment Script for sdnsoftech.info
# This script performs a complete production deployment

set -e

echo "🚀 Starting Production Deployment for sdnsoftech.info"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/earnings-app"
REPO_URL="https://github.com/sparjan1245/EarningsApp-frontend-Pro.git"
DOMAIN="sdnsoftech.info"

# Step 1: Update System Packages
echo -e "${YELLOW}📦 Step 1: Updating system packages...${NC}"
apt update && apt upgrade -y

# Step 2: Install Required Software
echo -e "${YELLOW}📦 Step 2: Installing required software...${NC}"

# Node.js (LTS)
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
fi

# Nginx
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi

# PostgreSQL Client
if ! command -v psql &> /dev/null; then
    apt install -y postgresql-client
fi

# Redis
if ! command -v redis-cli &> /dev/null; then
    apt install -y redis-server
    systemctl enable redis-server
    systemctl start redis-server
fi

# Certbot for SSL
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

# Step 3: Setup Firewall
echo -e "${YELLOW}🔥 Step 3: Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
fi

# Step 4: Clone/Update Repository
echo -e "${YELLOW}📥 Step 4: Setting up application directory...${NC}"
if [ ! -d "$APP_DIR" ]; then
    mkdir -p $APP_DIR
    git clone $REPO_URL $APP_DIR
else
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/main
    git pull origin main
fi

cd $APP_DIR

# Step 5: Install Dependencies
echo -e "${YELLOW}📦 Step 5: Installing dependencies...${NC}"
cd backend/gateway && npm ci --production && cd ../..
cd backend/authservice2 && npm ci --production && cd ../..
cd backend/adminservice && npm ci --production && cd ../..

# Step 6: Build Services
echo -e "${YELLOW}🔨 Step 6: Building services...${NC}"
cd backend/gateway && npm run build && cd ../..
cd backend/authservice2 && npm run build && cd ../..
cd backend/adminservice && npm run build && cd ../..

# Step 7: Setup Environment Variables
echo -e "${YELLOW}⚙️  Step 7: Setting up environment variables...${NC}"
if [ ! -f "$APP_DIR/.env.production" ]; then
    echo -e "${RED}⚠️  WARNING: .env.production not found!${NC}"
    echo "Please create .env.production file with required variables."
    echo "See .env.production.example for reference."
    exit 1
fi

# Step 8: Database Migrations
echo -e "${YELLOW}🗄️  Step 8: Running database migrations...${NC}"
cd backend/authservice2
if [ -f "prisma/schema.prisma" ]; then
    npx prisma generate
    npx prisma migrate deploy
fi
cd ../..

cd backend/adminservice
if [ -f "prisma/schema.prisma" ]; then
    npx prisma generate
    npx prisma migrate deploy
fi
cd ../..

# Step 9: Create Logs Directory
echo -e "${YELLOW}📝 Step 9: Creating logs directory...${NC}"
mkdir -p $APP_DIR/logs

# Step 10: Stop Existing PM2 Processes
echo -e "${YELLOW}🛑 Step 10: Stopping existing services...${NC}"
pm2 stop all || true
pm2 delete all || true

# Step 11: Start Services with PM2
echo -e "${YELLOW}🚀 Step 11: Starting services with PM2...${NC}"
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save

# Step 12: Setup Nginx
echo -e "${YELLOW}🌐 Step 12: Configuring Nginx...${NC}"
if [ -f "$APP_DIR/nginx/sdnsoftech.conf" ]; then
    cp $APP_DIR/nginx/sdnsoftech.conf /etc/nginx/sites-available/sdnsoftech.conf
    ln -sf /etc/nginx/sites-available/sdnsoftech.conf /etc/nginx/sites-enabled/
    
    # Remove default nginx site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    nginx -t
    
    # Reload nginx
    systemctl reload nginx
else
    echo -e "${RED}❌ Nginx config file not found!${NC}"
    exit 1
fi

# Step 13: Setup SSL Certificate
echo -e "${YELLOW}🔒 Step 13: Setting up SSL certificate...${NC}"
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "Obtaining SSL certificate..."
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || {
        echo -e "${YELLOW}⚠️  SSL certificate setup failed. You can run it manually later:${NC}"
        echo "certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    }
else
    echo "SSL certificate already exists. Renewing..."
    certbot renew --quiet
fi

# Step 14: Final Nginx Reload
systemctl reload nginx

# Step 15: Verify Services
echo -e "${YELLOW}✅ Step 15: Verifying services...${NC}"
sleep 5

# Check PM2 status
pm2 status

# Check if services are running
if pm2 list | grep -q "gateway.*online"; then
    echo -e "${GREEN}✅ Gateway is running${NC}"
else
    echo -e "${RED}❌ Gateway is not running${NC}"
    pm2 logs gateway --lines 50
fi

if pm2 list | grep -q "auth-service.*online"; then
    echo -e "${GREEN}✅ Auth Service is running${NC}"
else
    echo -e "${RED}❌ Auth Service is not running${NC}"
    pm2 logs auth-service --lines 50
fi

if pm2 list | grep -q "adminservice.*online"; then
    echo -e "${GREEN}✅ Admin Service is running${NC}"
else
    echo -e "${RED}❌ Admin Service is not running${NC}"
    pm2 logs adminservice --lines 50
fi

# Test health endpoint
echo -e "${YELLOW}🏥 Testing health endpoint...${NC}"
sleep 3
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed!${NC}"
    echo "Check logs: pm2 logs"
fi

echo ""
echo -e "${GREEN}=================================================="
echo "🎉 Deployment Complete!"
echo "=================================================="
echo ""
echo "Your application should now be available at:"
echo "  - https://$DOMAIN"
echo "  - https://www.$DOMAIN"
echo ""
echo "Useful commands:"
echo "  - View logs: pm2 logs"
echo "  - Restart services: pm2 restart all"
echo "  - Check status: pm2 status"
echo "  - View nginx logs: tail -f /var/log/nginx/sdnsoftech-error.log"
echo ""

