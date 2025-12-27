#!/bin/bash

# Complete VPS Deployment Steps for sdnsoftech.info
# Run this script on your VPS server as root

set -e

echo "🚀 Starting Production Deployment for sdnsoftech.info"
echo "=================================================="

# Configuration
APP_DIR="/var/www/earnings-app"
REPO_URL="https://github.com/sparjan1245/EarningsApp-frontend-Pro.git"
DOMAIN="sdnsoftech.info"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ============================================
# STEP 1: Update System Packages
# ============================================
echo -e "${YELLOW}📦 STEP 1: Updating system packages...${NC}"
apt update && apt upgrade -y

# ============================================
# STEP 2: Install Required Software
# ============================================
echo -e "${YELLOW}📦 STEP 2: Installing required software...${NC}"

# Node.js (LTS 20.x)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo -e "${GREEN}✅ Node.js installed: $(node --version)${NC}"
else
    echo -e "${GREEN}✅ Node.js already installed: $(node --version)${NC}"
fi

# PM2
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
    echo -e "${GREEN}✅ PM2 installed${NC}"
else
    echo -e "${GREEN}✅ PM2 already installed${NC}"
fi

# Nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo -e "${GREEN}✅ Nginx installed${NC}"
else
    echo -e "${GREEN}✅ Nginx already installed${NC}"
fi

# PostgreSQL Client
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL client..."
    apt install -y postgresql-client
    echo -e "${GREEN}✅ PostgreSQL client installed${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL client already installed${NC}"
fi

# Redis
if ! command -v redis-cli &> /dev/null; then
    echo "Installing Redis..."
    apt install -y redis-server
    systemctl enable redis-server
    systemctl start redis-server
    echo -e "${GREEN}✅ Redis installed${NC}"
else
    echo -e "${GREEN}✅ Redis already installed${NC}"
fi

# Certbot for SSL
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    apt install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✅ Certbot installed${NC}"
else
    echo -e "${GREEN}✅ Certbot already installed${NC}"
fi

# ============================================
# STEP 3: Setup Firewall
# ============================================
echo -e "${YELLOW}🔥 STEP 3: Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    echo -e "${GREEN}✅ Firewall configured${NC}"
else
    echo -e "${YELLOW}⚠️  UFW not available, skipping firewall setup${NC}"
fi

# ============================================
# STEP 4: Clone/Update Repository
# ============================================
echo -e "${YELLOW}📥 STEP 4: Setting up application directory...${NC}"
if [ ! -d "$APP_DIR" ]; then
    echo "Cloning repository..."
    mkdir -p $APP_DIR
    git clone $REPO_URL $APP_DIR
    echo -e "${GREEN}✅ Repository cloned${NC}"
else
    echo "Updating existing repository..."
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/main
    git pull origin main
    echo -e "${GREEN}✅ Repository updated${NC}"
fi

cd $APP_DIR

# ============================================
# STEP 5: Setup Environment Variables
# ============================================
echo -e "${YELLOW}⚙️  STEP 5: Setting up environment variables...${NC}"
if [ ! -f "$APP_DIR/.env.production" ]; then
    echo -e "${RED}⚠️  WARNING: .env.production not found!${NC}"
    echo "Creating from example..."
    cp env.production.example .env.production
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env.production with your actual values:${NC}"
    echo "   nano .env.production"
    echo ""
    echo "Required values to update:"
    echo "  - DATABASE_URL"
    echo "  - JWT_SECRET"
    echo "  - GOOGLE_CLIENT_ID"
    echo "  - GOOGLE_CLIENT_SECRET"
    echo "  - RESEND_API_KEY"
    echo ""
    read -p "Press Enter after you've updated .env.production, or Ctrl+C to cancel..."
else
    echo -e "${GREEN}✅ .env.production already exists${NC}"
fi

# ============================================
# STEP 6: Install Dependencies
# ============================================
echo -e "${YELLOW}📦 STEP 6: Installing dependencies...${NC}"
cd backend/gateway
npm ci --production
cd ../..

cd backend/authservice2
npm ci --production
cd ../..

cd backend/adminservice
npm ci --production
cd ../..

echo -e "${GREEN}✅ Dependencies installed${NC}"

# ============================================
# STEP 7: Build Services
# ============================================
echo -e "${YELLOW}🔨 STEP 7: Building services...${NC}"
cd backend/gateway
npm run build
cd ../..

cd backend/authservice2
npm run build
cd ../..

cd backend/adminservice
npm run build
cd ../..

echo -e "${GREEN}✅ Services built${NC}"

# ============================================
# STEP 8: Database Migrations
# ============================================
echo -e "${YELLOW}🗄️  STEP 8: Running database migrations...${NC}"
cd backend/authservice2
if [ -f "prisma/schema.prisma" ]; then
    npx prisma generate
    npx prisma migrate deploy
    echo -e "${GREEN}✅ Auth service migrations completed${NC}"
fi
cd ../..

cd backend/adminservice
if [ -f "prisma/schema.prisma" ]; then
    npx prisma generate
    npx prisma migrate deploy
    echo -e "${GREEN}✅ Admin service migrations completed${NC}"
fi
cd ../..

# ============================================
# STEP 9: Create Logs Directory
# ============================================
echo -e "${YELLOW}📝 STEP 9: Creating logs directory...${NC}"
mkdir -p $APP_DIR/logs
echo -e "${GREEN}✅ Logs directory created${NC}"

# ============================================
# STEP 10: Stop Existing PM2 Processes
# ============================================
echo -e "${YELLOW}🛑 STEP 10: Stopping existing services...${NC}"
pm2 stop all || true
pm2 delete all || true
echo -e "${GREEN}✅ Existing services stopped${NC}"

# ============================================
# STEP 11: Start Services with PM2
# ============================================
echo -e "${YELLOW}🚀 STEP 11: Starting services with PM2...${NC}"
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
echo -e "${GREEN}✅ Services started${NC}"

# ============================================
# STEP 12: Setup Nginx
# ============================================
echo -e "${YELLOW}🌐 STEP 12: Configuring Nginx...${NC}"
if [ -f "$APP_DIR/nginx/sdnsoftech.conf" ]; then
    cp $APP_DIR/nginx/sdnsoftech.conf /etc/nginx/sites-available/sdnsoftech.conf
    ln -sf /etc/nginx/sites-available/sdnsoftech.conf /etc/nginx/sites-enabled/
    
    # Remove default nginx site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    nginx -t
    
    # Reload nginx
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx configured${NC}"
else
    echo -e "${RED}❌ Nginx config file not found!${NC}"
    exit 1
fi

# ============================================
# STEP 13: Setup SSL Certificate
# ============================================
echo -e "${YELLOW}🔒 STEP 13: Setting up SSL certificate...${NC}"
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "Obtaining SSL certificate..."
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || {
        echo -e "${YELLOW}⚠️  SSL certificate setup failed. You can run it manually later:${NC}"
        echo "certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    }
else
    echo "SSL certificate already exists. Renewing..."
    certbot renew --quiet
    echo -e "${GREEN}✅ SSL certificate renewed${NC}"
fi

# ============================================
# STEP 14: Final Nginx Reload
# ============================================
systemctl reload nginx
echo -e "${GREEN}✅ Nginx reloaded${NC}"

# ============================================
# STEP 15: Verify Services
# ============================================
echo -e "${YELLOW}✅ STEP 15: Verifying services...${NC}"
sleep 5

# Check PM2 status
echo ""
echo "PM2 Status:"
pm2 status

# Check if services are running
echo ""
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
echo ""
echo -e "${YELLOW}🏥 Testing health endpoint...${NC}"
sleep 3
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed!${NC}"
    echo "Check logs: pm2 logs"
fi

# ============================================
# DEPLOYMENT COMPLETE
# ============================================
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

