#!/bin/bash

# Fix VPS deployment issues
# Run this on your VPS

set -e

APP_DIR="/var/www/earnings-app"

echo "🔧 Fixing VPS deployment issues..."

cd $APP_DIR

# 1. Fix NODE_OPTIONS in .env.production (remove if causing issues)
echo "📝 Fixing NODE_OPTIONS in .env.production..."
sed -i 's/NODE_OPTIONS=--max-old-space-size=1024/# NODE_OPTIONS=--max-old-space-size=1024/' .env.production || true

# 2. Clean up duplicate nginx configs
echo "🌐 Cleaning up nginx configs..."
rm -f /etc/nginx/sites-enabled/earnings-app
rm -f /etc/nginx/sites-enabled/sdnsoftech.info
rm -f /etc/nginx/sites-enabled/sdnsoftech.conf

# Copy fresh config
cp nginx/sdnsoftech.conf /etc/nginx/sites-available/sdnsoftech.conf
ln -sf /etc/nginx/sites-available/sdnsoftech.conf /etc/nginx/sites-enabled/sdnsoftech.conf

# Test nginx
nginx -t
systemctl reload nginx

# 3. Run migrations properly (load env vars correctly)
echo "🗄️  Running database migrations..."

cd backend/authservice2
if [ -f "../../.env.production" ]; then
    # Load only valid env vars (skip comments and empty lines)
    export $(grep -v '^#' ../../.env.production | grep -v '^$' | grep '^DATABASE_URL=' | xargs)
    if [ ! -z "$DATABASE_URL" ]; then
        npx prisma migrate deploy || echo "⚠️  Migration failed, but continuing..."
    else
        echo "⚠️  DATABASE_URL not set, skipping migrations"
    fi
fi
cd ../..

cd backend/adminservice
if [ -f "../../.env.production" ]; then
    # Load DATABASE_URL or ADMIN_DATABASE_URL
    export $(grep -v '^#' ../../.env.production | grep -v '^$' | grep -E '^(DATABASE_URL|ADMIN_DATABASE_URL)=' | xargs)
    DB_URL=${ADMIN_DATABASE_URL:-$DATABASE_URL}
    if [ ! -z "$DB_URL" ]; then
        export DATABASE_URL=$DB_URL
        npx prisma migrate deploy || echo "⚠️  Migration failed, but continuing..."
    else
        echo "⚠️  Database URL not set, skipping migrations"
    fi
fi
cd ../..

# 4. Restart PM2 services
echo "🔄 Restarting PM2 services..."
pm2 stop all || true
pm2 delete all || true
pm2 start ecosystem.config.js
pm2 save

# 5. Wait a moment and check status
sleep 3
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "✅ Fixes applied!"
echo ""
echo "Check logs: pm2 logs"
echo "Test health: curl http://localhost:3000/health"

