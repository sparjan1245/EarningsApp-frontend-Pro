#!/bin/bash

# Fix existing directory and deploy
# Run this on your VPS

set -e

APP_DIR="/var/www/earnings-app"
REPO_URL="https://github.com/sparjan1245/EarningsApp-frontend-Pro.git"

echo "🔧 Fixing existing directory and deploying..."

# Step 1: Backup existing files if needed
if [ -d "$APP_DIR" ] && [ "$(ls -A $APP_DIR)" ]; then
    echo "⚠️  Directory exists with files. Creating backup..."
    mv $APP_DIR ${APP_DIR}.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created"
fi

# Step 2: Remove old directory
rm -rf $APP_DIR

# Step 3: Clone fresh repository
echo "📥 Cloning repository..."
git clone $REPO_URL $APP_DIR
cd $APP_DIR

# Step 4: Check if files exist
echo "📋 Checking repository contents..."
if [ ! -f "env.production.example" ]; then
    echo "❌ Repository files not found. Checking what we have..."
    ls -la
    exit 1
fi

# Step 5: Create .env.production
echo "⚙️  Setting up environment file..."
if [ ! -f ".env.production" ]; then
    cp env.production.example .env.production
    echo "✅ Created .env.production from example"
    echo "⚠️  IMPORTANT: Edit .env.production with your actual values!"
    echo "   Run: nano .env.production"
else
    echo "✅ .env.production already exists"
fi

# Step 6: Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x deploy-production.sh 2>/dev/null || echo "⚠️  deploy-production.sh not found"
chmod +x VPS_DEPLOYMENT_STEPS.sh 2>/dev/null || echo "⚠️  VPS_DEPLOYMENT_STEPS.sh not found"

# Step 7: List available files
echo ""
echo "📁 Repository contents:"
ls -la | head -20

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.production: nano .env.production"
echo "2. Run deployment: ./VPS_DEPLOYMENT_STEPS.sh"
echo "   OR: ./deploy-production.sh"

