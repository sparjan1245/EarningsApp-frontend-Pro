#!/bin/bash

# Build script for cPanel deployment
# This script prepares all services for deployment to cPanel

set -e  # Exit on error

echo "🚀 Starting cPanel Build Process..."
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create deployment directory
DEPLOY_DIR="deployment"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

echo -e "${GREEN}✓${NC} Created deployment directory"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo -e "${RED}✗${NC} Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" != "16" ]; then
    echo -e "${YELLOW}⚠${NC} Warning: Node.js version is not 16.x (current: $(node --version))"
    echo "   For best compatibility, use Node.js 16"
    read -p "   Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} Prerequisites check passed"

# Build Frontend
echo ""
echo "📦 Building Frontend..."
cd frontend/earnings-calendar

if [ ! -f "package.json" ]; then
    echo -e "${RED}✗${NC} package.json not found in frontend/earnings-calendar"
    exit 1
fi

npm install
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}✗${NC} Frontend build failed - dist directory not found"
    exit 1
fi

# Create frontend zip
cd dist
zip -r "../../../$DEPLOY_DIR/frontend-build.zip" . -q
cd ../../..
echo -e "${GREEN}✓${NC} Frontend build completed"

# Build Gateway Service
echo ""
echo "📦 Building Gateway Service..."
cd backend/gateway

if [ ! -f "package.json" ]; then
    echo -e "${RED}✗${NC} package.json not found in backend/gateway"
    exit 1
fi

npm install
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}✗${NC} Gateway build failed - dist directory not found"
    exit 1
fi

# Copy proto files
if [ -d "../../proto" ]; then
    cp -r ../../proto .
    echo -e "${GREEN}✓${NC} Copied proto files"
fi

# Create gateway zip (exclude node_modules)
zip -r "../$DEPLOY_DIR/gateway.zip" dist package.json proto -q 2>/dev/null || {
    # If zip fails, use tar
    tar -czf "../$DEPLOY_DIR/gateway.tar.gz" dist package.json proto 2>/dev/null || {
        echo -e "${YELLOW}⚠${NC} Creating directory structure instead..."
        mkdir -p "../../$DEPLOY_DIR/gateway"
        cp -r dist package.json proto "../../$DEPLOY_DIR/gateway/"
    }
}
cd ../..
echo -e "${GREEN}✓${NC} Gateway build completed"

# Build Auth Service
echo ""
echo "📦 Building Auth Service..."
cd backend/authservice2

if [ ! -f "package.json" ]; then
    echo -e "${RED}✗${NC} package.json not found in backend/authservice2"
    exit 1
fi

npm install
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}✗${NC} Auth service build failed - dist directory not found"
    exit 1
fi

# Copy proto files
if [ -d "../../proto" ]; then
    cp -r ../../proto .
    echo -e "${GREEN}✓${NC} Copied proto files"
fi

# Create authservice zip (include prisma, exclude node_modules)
zip -r "../$DEPLOY_DIR/authservice.zip" dist package.json prisma proto -q 2>/dev/null || {
    tar -czf "../$DEPLOY_DIR/authservice.tar.gz" dist package.json prisma proto 2>/dev/null || {
        echo -e "${YELLOW}⚠${NC} Creating directory structure instead..."
        mkdir -p "../../$DEPLOY_DIR/authservice2"
        cp -r dist package.json prisma proto "../../$DEPLOY_DIR/authservice2/"
    }
}
cd ../..
echo -e "${GREEN}✓${NC} Auth service build completed"

# Build Admin Service
echo ""
echo "📦 Building Admin Service..."
cd backend/adminservice

if [ ! -f "package.json" ]; then
    echo -e "${RED}✗${NC} package.json not found in backend/adminservice"
    exit 1
fi

npm install
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}✗${NC} Admin service build failed - dist directory not found"
    exit 1
fi

# Copy proto files
if [ -d "../../proto" ]; then
    cp -r ../../proto .
    echo -e "${GREEN}✓${NC} Copied proto files"
fi

# Create adminservice zip (include prisma, exclude node_modules)
zip -r "../$DEPLOY_DIR/adminservice.zip" dist package.json prisma proto -q 2>/dev/null || {
    tar -czf "../$DEPLOY_DIR/adminservice.tar.gz" dist package.json prisma proto 2>/dev/null || {
        echo -e "${YELLOW}⚠${NC} Creating directory structure instead..."
        mkdir -p "../../$DEPLOY_DIR/adminservice"
        cp -r dist package.json prisma proto "../../$DEPLOY_DIR/adminservice/"
    }
}
cd ../..
echo -e "${GREEN}✓${NC} Admin service build completed"

# Create .env.example files
echo ""
echo "📝 Creating environment template files..."

cat > "$DEPLOY_DIR/gateway.env.example" << 'EOF'
PORT=3000
NODE_ENV=production
AUTHSERVICE_HOST=localhost
AUTHSERVICE_PORT=3001
ADMINSERVICE_HOST=localhost
ADMINSERVICE_PORT=3002

# Low memory optimization (adjust based on available RAM)
# 1GB server: --max-old-space-size=256
# 2GB server: --max-old-space-size=512
# 4GB+ server: --max-old-space-size=1024
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
EOF

cat > "$DEPLOY_DIR/authservice.env.example" << 'EOF'
PORT=3001
NODE_ENV=production

# Database Configuration (PostgreSQL 13.22)
# Replace 'user', 'password', 'localhost', '5432', 'earnings_authdb' with your actual values
# connection_limit=5 and pool_timeout=20 are optimized for low memory environments
DATABASE_URL=postgresql://user:password@localhost:5432/earnings_authdb?connection_limit=5&pool_timeout=20
DATABASE_POOL_SIZE=5

# Redis Configuration (optional - can use in-memory cache if Redis not available)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
# IMPORTANT: Change JWT_SECRET to a strong, random string (minimum 32 characters)
JWT_SECRET=change-this-in-production-minimum-32-characters-long
JWT_EXPIRATION=15m

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/oauth/google/callback

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=your-email@domain.com

# Low memory optimization (adjust based on available RAM)
# 1GB server: --max-old-space-size=256
# 2GB server: --max-old-space-size=512
# 4GB+ server: --max-old-space-size=1024
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
EOF

cat > "$DEPLOY_DIR/adminservice.env.example" << 'EOF'
PORT=3002
NODE_ENV=production

# Database Configuration (PostgreSQL 13.22)
# Replace 'user', 'password', 'localhost', '5432', 'earnings_admindb' with your actual values
# connection_limit=5 and pool_timeout=20 are optimized for low memory environments
DATABASE_URL=postgresql://user:password@localhost:5432/earnings_admindb?connection_limit=5&pool_timeout=20
DATABASE_POOL_SIZE=5

# Redis Configuration (optional - can use in-memory cache if Redis not available)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
# IMPORTANT: Change JWT_SECRET to a strong, random string (minimum 32 characters)
JWT_SECRET=change-this-in-production-minimum-32-characters-long
JWT_EXPIRATION=30m

# Refresh Token Configuration
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this-minimum-32-chars
REFRESH_TOKEN_EXPIRATION=7d

# Low memory optimization (adjust based on available RAM)
# 1GB server: --max-old-space-size=256
# 2GB server: --max-old-space-size=512
# 4GB+ server: --max-old-space-size=1024
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
EOF

echo -e "${GREEN}✓${NC} Environment template files created"

# Summary
echo ""
echo "===================================="
echo -e "${GREEN}✅ Build Process Completed!${NC}"
echo "===================================="
echo ""
echo "📦 Deployment packages created in: $DEPLOY_DIR/"
echo ""
echo "Files created:"
ls -lh "$DEPLOY_DIR" | grep -E '\.(zip|tar\.gz|env\.example)$' || ls -lh "$DEPLOY_DIR"
echo ""
echo "📋 Next steps:"
echo "1. Review and update .env.example files with your production values"
echo "2. Upload packages to your cPanel server"
echo "3. Extract files in appropriate directories"
echo "4. Create .env files from .env.example templates"
echo "5. Install dependencies: npm install --production"
echo "6. Generate Prisma clients: npx prisma generate"
echo "7. Run database migrations: npx prisma migrate deploy"
echo "8. Configure Node.js applications in cPanel"
echo ""
echo "📖 See CPANEL_DEPLOYMENT_NODE16_PG13.md for detailed instructions"
echo ""


