#!/bin/bash

# ⚙️ PM2 Ecosystem Config Creator
# This script creates the PM2 ecosystem.config.js file

set -e

echo "=========================================="
echo "⚙️  PM2 Ecosystem Config Creator"
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

# Check if we're in the project root
if [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory!"
    exit 1
fi

PROJECT_ROOT=$(pwd)

# Create logs directory
echo "Creating logs directory..."
mkdir -p logs
print_success "Logs directory created"

# Create ecosystem.config.js
echo "Creating PM2 ecosystem.config.js..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'gateway',
      script: './dist/main.js',
      cwd: './backend/gateway',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/gateway-error.log',
      out_file: './logs/gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'authservice',
      script: './dist/src/main.js',
      cwd: './backend/authservice2',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/auth-error.log',
      out_file: './logs/auth-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'adminservice',
      script: './dist/main.js',
      cwd: './backend/adminservice',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: './logs/admin-error.log',
      out_file: './logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
EOF

print_success "PM2 ecosystem.config.js created"

echo ""
print_info "PM2 configuration file created at: $PROJECT_ROOT/ecosystem.config.js"
echo ""
echo "Next steps:"
echo "1. Make sure all .env files are configured"
echo "2. Start services with: pm2 start ecosystem.config.js"
echo "3. Save PM2 config: pm2 save"
echo "4. Setup startup: pm2 startup"
echo ""



