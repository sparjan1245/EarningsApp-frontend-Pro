# 🔧 Fix: JavaScript Heap Out of Memory Error

Your cPanel server is running out of memory during `npm install`. Here are solutions:

---

## ✅ Solution 1: Increase Node.js Memory Limit (Recommended)

Set `NODE_OPTIONS` before running npm install:

```bash
# Connect to server
ssh nailartsdesign@66-116-197-185

# Set memory limit (increase to 512MB or 1024MB)
export NODE_OPTIONS="--max-old-space-size=512"

# Now try npm install
cd ~/backend/gateway
npm install --production --omit=dev --no-audit --prefer-offline

# Clear cache
npm cache clean --force

# Try next service
cd ~/backend/authservice2
export NODE_OPTIONS="--max-old-space-size=512"
npm install --production --omit=dev --no-audit --prefer-offline
npm cache clean --force

cd ~/backend/adminservice
export NODE_OPTIONS="--max-old-space-size=512"
npm install --production --omit=dev --no-audit --prefer-offline
npm cache clean --force
```

**Note**: Use `--omit=dev` instead of `--production` (npm warning you saw).

---

## ✅ Solution 2: Install One Package at a Time (Very Low Memory)

If Solution 1 still fails, install dependencies in smaller batches:

```bash
cd ~/backend/gateway
export NODE_OPTIONS="--max-old-space-size=512"

# Install core dependencies first
npm install --production --omit=dev --no-save @nestjs/common @nestjs/core @nestjs/platform-express --no-audit

# Then install rest
npm install --production --omit=dev --no-audit --prefer-offline

npm cache clean --force
```

---

## ✅ Solution 3: Install Locally and Upload node_modules (Best for Very Low Memory Servers)

**On your local machine** (with Node 16):

```powershell
# Navigate to each service
cd backend\gateway
npm install --production --omit=dev

cd ..\authservice2
npm install --production --omit=dev
npx prisma generate

cd ..\adminservice
npm install --production --omit=dev
npx prisma generate
```

**Then upload node_modules to server**:

```bash
# From your local machine
# Create tarballs (compressed)
cd backend/gateway
tar -czf gateway-node_modules.tar.gz node_modules

cd ../authservice2
tar -czf authservice-node_modules.tar.gz node_modules

cd ../adminservice
tar -czf adminservice-node_modules.tar.gz node_modules
```

**Upload and extract on server**:

```bash
# Upload (from local machine)
scp backend/gateway/gateway-node_modules.tar.gz nailartsdesign@66-116-197-185:~/backend/gateway/
scp backend/authservice2/authservice-node_modules.tar.gz nailartsdesign@66-116-197-185:~/backend/authservice2/
scp backend/adminservice/adminservice-node_modules.tar.gz nailartsdesign@66-116-197-185:~/backend/adminservice/

# Extract on server
cd ~/backend/gateway
tar -xzf gateway-node_modules.tar.gz
rm gateway-node_modules.tar.gz

cd ~/backend/authservice2
tar -xzf authservice-node_modules.tar.gz
rm authservice-node_modules.tar.gz

cd ~/backend/adminservice
tar -xzf adminservice-node_modules.tar.gz
rm adminservice-node_modules.tar.gz
```

---

## ✅ Solution 4: Use Alternative: Install Dependencies in Node.js Selector

Some cPanel servers allow installing dependencies through the Node.js Selector UI:

1. **cPanel → Node.js Selector**
2. Create/Edit your application
3. Click **"Run NPM Install"** button (if available)
4. This might have more memory available

---

## 🎯 Recommended Approach for Your Server

Based on the error, try **Solution 1 first** with these exact commands:

```bash
# Gateway Service
cd ~/backend/gateway
export NODE_OPTIONS="--max-old-space-size=512"
npm install --omit=dev --no-audit --prefer-offline
npm cache clean --force

# Verify installation
ls -d node_modules/@nestjs/core 2>/dev/null && echo "✓ Gateway installed" || echo "✗ Failed"

# Auth Service
cd ~/backend/authservice2
export NODE_OPTIONS="--max-old-space-size=512"
npm install --omit=dev --no-audit --prefer-offline
npm cache clean --force

# Admin Service
cd ~/backend/adminservice
export NODE_OPTIONS="--max-old-space-size=512"
npm install --omit=dev --no-audit --prefer-offline
npm cache clean --force

# Final cleanup
npm cache clean --force
```

---

## 🔍 Check Available Memory

Before starting, check how much memory your server has:

```bash
# Check total and available memory
free -m

# Check current Node.js processes
ps aux | grep node

# Kill any existing Node.js processes if needed
pkill -f node
```

---

## ⚠️ Important Notes

1. **Use `--omit=dev`** instead of `--production` (npm recommendation)
2. **Set NODE_OPTIONS** in the same terminal session before npm install
3. **Install one service at a time** to avoid memory conflicts
4. **Clear npm cache** between installations
5. **If all else fails**, use Solution 3 (install locally and upload)

---

## 🚀 After Successful Installation

Once dependencies are installed:

```bash
# Generate Prisma clients (for services with Prisma)
cd ~/backend/authservice2
export NODE_OPTIONS="--max-old-space-size=512"
npx prisma generate

cd ~/backend/adminservice
export NODE_OPTIONS="--max-old-space-size=512"
npx prisma generate

# Verify installations
ls -d ~/backend/*/node_modules/@nestjs/core && echo "✅ All services installed successfully"
```

---

Try Solution 1 first - it should work for most cases!

