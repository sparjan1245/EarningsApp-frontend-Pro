# 🚀 Start Gateway Service in cPanel Node.js Selector

Follow these steps to configure and start the Gateway service in cPanel.

---

## ✅ Prerequisites Checklist

Before starting, verify:

- [x] Gateway node_modules extracted successfully
- [ ] Gateway .env file created
- [ ] Gateway dist folder exists (`dist/main.js`)
- [ ] Logs directory created

---

## 📋 Step 1: Verify Gateway Setup

**Via SSH** (verify everything is ready):

```bash
ssh nailartsdesign@66-116-197-185

# Check node_modules exists
cd ~/backend/gateway
ls -d node_modules/@nestjs/core && echo "✅ node_modules OK" || echo "❌ node_modules missing"

# Check dist folder exists
ls -f dist/main.js && echo "✅ dist/main.js exists" || echo "❌ Build missing - rebuild needed"

# Check package.json exists
ls -f package.json && echo "✅ package.json exists" || echo "❌ package.json missing"

# Check logs directory exists
mkdir -p logs
ls -d logs && echo "✅ logs directory ready"
```

---

## 📋 Step 2: Create/Verify .env File

**Create .env file if it doesn't exist**:

```bash
cd ~/backend/gateway

# Check if .env exists
if [ -f .env ]; then
    echo "✅ .env file exists"
    cat .env
else
    echo "⚠️  Creating .env file..."
    cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
AUTHSERVICE_HOST=localhost
AUTHSERVICE_PORT=3001
ADMINSERVICE_HOST=localhost
ADMINSERVICE_PORT=3002
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
EOF
    echo "✅ .env file created"
fi
```

**Or upload from your local machine**:

```powershell
# From your local machine
scp deployment\gateway.env.production nailartsdesign@66-116-197-185:~/backend/gateway/.env
```

---

## 📋 Step 3: Configure Gateway in cPanel Node.js Selector

1. **Login to cPanel**
   - Go to: https://nailartsdesign.com:2083 (or your cPanel URL)
   - Login with your credentials

2. **Open Node.js Selector**
   - Navigate to: **Software** → **Node.js Selector**
   - Click **Create Application**

3. **Fill in Gateway Application Settings**:

   **Basic Settings**:
   - **Node.js Version**: Select `16.x` (or latest 16.x available)
   - **Application root**: `/home/nailartsdesign/backend/gateway`
   - **Application URL**: 
     - Option A: `api.nailartsdesign.com` (if you have subdomain set up)
     - Option B: Leave blank or use `localhost:3000` (internal only)
   - **Application startup file**: `dist/main.js` ⚠️ **Important: No leading slash!**
   - **Application mode**: `Production`
   - **Passenger log file**: `logs/gateway.log` (relative to app root)

   **Environment Variables** (add these one by one):
   ```
   PORT=3000
   NODE_ENV=production
   AUTHSERVICE_HOST=localhost
   AUTHSERVICE_PORT=3001
   ADMINSERVICE_HOST=localhost
   ADMINSERVICE_PORT=3002
   NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
   ```

   **Important**: 
   - Add each environment variable on a separate line
   - Make sure `NODE_OPTIONS` is included (helps with low memory)

4. **Create Application**
   - Click **Create** button
   - Wait for application to be created

5. **DO NOT click "Run NPM Install"** (we already have node_modules uploaded)

6. **Start Application**
   - Click **Start App** button
   - Wait 30-60 seconds for application to start

---

## 📋 Step 4: Verify Gateway is Running

**Check Status in Node.js Selector**:
- Status should show: **Running** or **✓ Active**
- Check the logs section for any errors

**Via SSH** (test if Gateway responds):

```bash
# Test Gateway health endpoint
curl http://localhost:3000/health

# Or test any endpoint
curl http://localhost:3000/

# Check if process is running
ps aux | grep "dist/main.js" | grep gateway

# Check logs
tail -f ~/backend/gateway/logs/gateway.log
```

**Check Logs in cPanel**:
- Node.js Selector → Click on Gateway application
- View logs for any startup errors

---

## 🔍 Troubleshooting

### Issue 1: Application Won't Start

**Check**:
- ✅ `dist/main.js` exists: `ls -f ~/backend/gateway/dist/main.js`
- ✅ Environment variables are set correctly
- ✅ Node.js version is 16.x
- ✅ Logs directory is writable: `chmod 755 ~/backend/gateway/logs`

**View logs**:
```bash
tail -50 ~/backend/gateway/logs/gateway.log
```

### Issue 2: "Cannot find module" Errors

**Solution**:
```bash
cd ~/backend/gateway
# Verify node_modules exists
ls -d node_modules/@nestjs/core

# If missing, you need to extract node_modules.zip again
```

### Issue 3: Port Already in Use

**Check what's using port 3000**:
```bash
netstat -tulpn | grep 3000
# or
lsof -i :3000
```

**Solution**: Stop any other service using port 3000, or change PORT in .env file

### Issue 4: Memory Errors

**Update NODE_OPTIONS** in cPanel:
- Go to Node.js Selector → Edit Gateway application
- Update `NODE_OPTIONS` to lower value: `--max-old-space-size=128`
- Restart application

---

## ✅ Success Indicators

Gateway is running successfully if:

- ✅ Status shows "Running" in Node.js Selector
- ✅ `curl http://localhost:3000/health` returns a response
- ✅ No errors in logs
- ✅ Process is visible: `ps aux | grep node | grep gateway`

---

## 🎯 Next Steps

After Gateway is running:

1. ✅ **Configure Auth Service** (see next guide)
2. ✅ **Configure Admin Service** (see next guide)
3. ✅ **Test API endpoints**
4. ✅ **Configure frontend .htaccess** for API proxy

---

## 📝 Quick Reference

**Gateway Service Info**:
- **Port**: 3000
- **Startup File**: `dist/main.js`
- **Logs**: `logs/gateway.log`
- **Environment File**: `.env`
- **Node Version**: 16.x

**Important Paths**:
- Application Root: `/home/nailartsdesign/backend/gateway`
- Startup File: `dist/main.js` (relative to app root)
- Logs: `logs/gateway.log` (relative to app root)

---

**Once Gateway is running, proceed to configure Auth Service and Admin Service!** 🚀




