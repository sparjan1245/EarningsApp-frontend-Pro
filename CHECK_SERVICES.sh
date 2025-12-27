#!/bin/bash

# Check service status and logs
# Run this on your VPS

echo "🔍 Checking service status and logs..."
echo ""

# PM2 Status
echo "📊 PM2 Status:"
pm2 status
echo ""

# Check if ports are listening
echo "🔌 Checking ports:"
netstat -tulpn | grep -E '3000|3001|3002|50051|50052' || ss -tulpn | grep -E '3000|3001|3002|50051|50052'
echo ""

# Gateway logs
echo "📝 Gateway logs (last 30 lines):"
pm2 logs gateway --lines 30 --nostream
echo ""

# Auth service logs
echo "📝 Auth Service logs (last 30 lines):"
pm2 logs auth-service --lines 30 --nostream
echo ""

# Admin service logs
echo "📝 Admin Service logs (last 30 lines):"
pm2 logs adminservice --lines 30 --nostream
echo ""

# Test health endpoint
echo "🏥 Testing health endpoint:"
sleep 2
curl -v http://localhost:3000/health || echo "❌ Health check failed"
echo ""

# Check if files exist
echo "📁 Checking build files:"
ls -la /var/www/earnings-app/backend/gateway/dist/main.js
ls -la /var/www/earnings-app/backend/authservice2/dist/src/main.js
ls -la /var/www/earnings-app/backend/adminservice/dist/main.js
echo ""

echo "✅ Check complete!"

