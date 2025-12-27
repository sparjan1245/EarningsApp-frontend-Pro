#!/bin/bash

# Build frontend for production
# Run this on your VPS

set -e

APP_DIR="/var/www/earnings-app"

echo "🔨 Building frontend for production..."

cd $APP_DIR/frontend/earnings-calendar

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build for production
echo "🔨 Building frontend..."
npm run build

# Check if build was successful
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    echo "✅ Frontend built successfully!"
    echo "📁 Build output: $(du -sh dist)"
    ls -la dist | head -10
else
    echo "❌ Build failed! dist directory is empty or missing"
    exit 1
fi

# Set proper permissions
chown -R www-data:www-data dist || chown -R nginx:nginx dist || true

echo ""
echo "✅ Frontend build complete!"
echo "📁 Location: $APP_DIR/frontend/earnings-calendar/dist"

