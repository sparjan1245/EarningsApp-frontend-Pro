#!/bin/bash

# Fix NODE_OPTIONS issue
# Run this on your VPS

set -e

APP_DIR="/var/www/earnings-app"

echo "🔧 Fixing NODE_OPTIONS issue..."

cd $APP_DIR

# Remove or comment out NODE_OPTIONS from .env.production
if [ -f ".env.production" ]; then
    echo "📝 Removing NODE_OPTIONS from .env.production..."
    # Remove the line entirely
    sed -i '/^NODE_OPTIONS=/d' .env.production
    # Also remove commented versions
    sed -i '/^# NODE_OPTIONS=/d' .env.production
    echo "✅ NODE_OPTIONS removed"
    
    # Show what's left
    echo ""
    echo "Current .env.production (first 10 lines):"
    head -10 .env.production
else
    echo "⚠️  .env.production not found"
fi

# Unset NODE_OPTIONS in current shell
unset NODE_OPTIONS
export NODE_OPTIONS=""

# Restart PM2 services
echo ""
echo "🔄 Restarting PM2 services..."
pm2 stop all || true
pm2 delete all || true

# Start services without NODE_OPTIONS
NODE_OPTIONS="" pm2 start ecosystem.config.js
pm2 save

# Wait and check status
sleep 3
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "✅ Fix complete!"
echo ""
echo "Test health: curl http://localhost:3000/health"

