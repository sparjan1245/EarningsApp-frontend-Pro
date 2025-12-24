# 🔧 Fix: Gateway NPM Queue Issue

Your Gateway application is queued to run `npm install`, but we already have `node_modules` uploaded. Here's how to fix it.

---

## ⚠️ Problem

cPanel is trying to run `npm install` automatically, which will:
- ❌ Fail due to low memory
- ❌ Take unnecessary time
- ❌ We don't need it (node_modules already exists)

---

## ✅ Solution: Skip NPM Install and Start Directly

### Step 1: Check Current Status

In cPanel Node.js Selector:
- Gateway status shows: **Enabled** ✅
- But it says: "The system queued your application to ensure its dependencies ... npm: Queued …"

### Step 2: Cancel/Restart Application

**Option A: Wait for Queue to Complete (Then Restart)**

If the npm queue is running:
1. **Wait** for it to finish (or fail)
2. Once it completes/fails, click **Stop App**
3. Then click **Start App** directly (skip npm install)

**Option B: Restart Application Now**

1. In Node.js Selector → Gateway application
2. Click **Stop App** (if it shows as running/queued)
3. Wait 10 seconds
4. Click **Start App**
5. **IMPORTANT**: Do NOT click "Run NPM Install" button

### Step 3: Verify Gateway Starts

**Via SSH** (wait 30-60 seconds after clicking Start):

```bash
ssh nailartsdesign@66-116-197-185

# Test if Gateway is running
curl http://localhost:3000/health

# Check process
ps aux | grep "node.*dist/main.js" | grep -v grep

# Check logs
tail -50 ~/backend/gateway/logs/gateway.log
```

---

## 🔍 If Gateway Still Won't Start

### Check 1: Verify All Required Files Exist

```bash
cd ~/backend/gateway

echo "=== Gateway Setup Verification ==="
[ -f dist/main.js ] && echo "✅ dist/main.js" || echo "❌ dist/main.js MISSING"
[ -d node_modules/@nestjs/core ] && echo "✅ node_modules" || echo "❌ node_modules MISSING"
[ -f package.json ] && echo "✅ package.json" || echo "❌ package.json MISSING"
[ -f .env ] && echo "✅ .env" || echo "❌ .env MISSING"

# Check .env has all required variables
if [ -f .env ]; then
    echo ""
    echo "=== .env Variables ==="
    grep -E "PORT|NODE_ENV|AUTHSERVICE|ADMINSERVICE|NODE_OPTIONS" .env || echo "⚠️  Missing variables"
fi
```

### Check 2: Verify Environment Variables in cPanel

In cPanel Node.js Selector → Gateway → Edit:

**Make sure ALL these are set**:
```
PORT=3000
NODE_ENV=production
AUTHSERVICE_HOST=localhost
AUTHSERVICE_PORT=3001
ADMINSERVICE_HOST=localhost
ADMINSERVICE_PORT=3002
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
```

### Check 3: Check Application Startup File

In cPanel Node.js Selector → Gateway → Edit:

- **Application Startup File**: Should be `dist/main.js` (NO leading slash)
- **Application Path**: Should be `backend/gateway`

---

## 🔧 Manual Test (To See Errors)

If Gateway still won't start, test manually to see the exact error:

```bash
cd ~/backend/gateway

# Set environment variables
export NODE_OPTIONS="--max-old-space-size=256 --max-semi-space-size=64"
export PORT=3000
export NODE_ENV=production
export AUTHSERVICE_HOST=localhost
export AUTHSERVICE_PORT=3001
export ADMINSERVICE_HOST=localhost
export ADMINSERVICE_PORT=3002

# Try to start manually
node dist/main.js
```

**Press Ctrl+C after a few seconds**, but this will show you any startup errors.

---

## ✅ Success Indicators

Gateway is working correctly when:

1. ✅ Status in cPanel shows **"Running"** (not "Queued" or "Stopped")
2. ✅ `curl http://localhost:3000/health` returns HTTP response
3. ✅ `curl https://api.nailartsdesign.com/health` works (if subdomain configured)
4. ✅ Process visible: `ps aux | grep node | grep gateway`
5. ✅ No errors in logs

---

## 🎯 Quick Action Steps

**Right now, do this**:

1. **In cPanel Node.js Selector**:
   - Click **Stop App** on Gateway (if it shows as running/queued)
   - Wait 10 seconds
   - Click **Start App**
   - **DO NOT click "Run NPM Install"**

2. **Wait 30-60 seconds**

3. **Test via SSH**:
   ```bash
   curl http://localhost:3000/health
   ```

4. **If still not working**, check logs:
   ```bash
   tail -100 ~/backend/gateway/logs/gateway.log
   ```

---

## 📋 Common Issues

### Issue: Gateway Status Shows "Queued" Forever

**Solution**: 
- Click **Stop App** to cancel queue
- Then click **Start App** directly

### Issue: "npm install" Keeps Running

**Solution**:
- The queue should eventually fail/timeout
- Once it fails, click **Start App** directly
- Gateway will use existing node_modules

### Issue: Gateway Starts Then Stops Immediately

**Check logs** for errors:
```bash
tail -100 ~/backend/gateway/logs/gateway.log
```

Common causes:
- Missing environment variables
- Module not found (verify node_modules exists)
- Port conflict

---

**Try stopping and restarting the application in cPanel - it should start using the existing node_modules!** 🚀

