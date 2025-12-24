# 🔧 Fix Gateway Configuration in cPanel

Your Gateway is configured but not running. Here's how to fix it:

---

## ✅ Step 1: Add Missing Environment Variables

In cPanel Node.js Selector, you need to add these missing environment variables:

**Currently you have**:
- ✅ NODE_ENV=production
- ✅ NODE_OPTIONS=--max-old-space-size=256
- ✅ PORT=3000

**Add these missing ones**:
1. Click **Edit** on your Gateway application
2. Scroll to **Environment Variables** section
3. Click **Add Environment Variable** (or similar button)
4. Add each of these:

```
AUTHSERVICE_HOST=localhost
AUTHSERVICE_PORT=3001
ADMINSERVICE_HOST=localhost
ADMINSERVICE_PORT=3002
```

**Important**: Make sure `NODE_OPTIONS` includes both flags:
```
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
```

---

## ✅ Step 2: Verify Application Startup File

In cPanel Node.js Selector → Edit Gateway:

1. **Check "Application Startup File" field**:
   - Should be: `dist/main.js`
   - ⚠️ **NO leading slash** (not `/dist/main.js`)
   - ⚠️ **Relative to Application Path** (backend/gateway)

2. **Verify Application Path**:
   - Should be: `backend/gateway`
   - This means full path is: `/home/nailartsdesign/backend/gateway`

---

## ✅ Step 3: Set Application URL (Important!)

**Current Issue**: Your Base URL is `nailartsdesign.com/` but Gateway should be accessible at `/api/`

**Option A: Use Subdomain** (Recommended):
- Change **Base Application URL** to: `api.nailartsdesign.com`
- Gateway will be accessible at: `https://api.nailartsdesign.com/`

**Option B: Use Path** (If you want `/api/` route):
- Keep **Base Application URL** as: `nailartsdesign.com`
- Add path routing in `.htaccess` (we'll do this for frontend)

**For now, Option A is easier**: Set URL to `api.nailartsdesign.com` or leave as internal port.

---

## ✅ Step 4: Start/Restart Application

1. In Node.js Selector → Gateway application
2. Click **Stop App** (if it shows as running)
3. Wait 10 seconds
4. Click **Start App**
5. Wait 30-60 seconds

---

## ✅ Step 5: Verify Gateway is Running

**Via SSH**:

```bash
# Test if Gateway responds
curl http://localhost:3000/health

# Or test root endpoint
curl http://localhost:3000/

# Check if Node.js process is running
ps aux | grep "node.*dist/main.js" | grep -v grep

# Check logs
tail -50 ~/backend/gateway/logs/gateway.log

# Or via cPanel logs
# Node.js Selector → Gateway → View Logs
```

**Expected Results**:
- ✅ `curl http://localhost:3000/health` should return HTTP response (not "Connection refused")
- ✅ Process should be visible in `ps aux`
- ✅ No errors in logs

---

## 🔍 Troubleshooting

### Issue: Still Getting "Connection Refused"

**Check 1: Verify dist/main.js exists**
```bash
ls -la ~/backend/gateway/dist/main.js
# Should show the file exists
```

**Check 2: Check application logs**
```bash
# Via SSH
tail -100 ~/backend/gateway/logs/gateway.log

# Or in cPanel: Node.js Selector → Gateway → View Logs
```

**Check 3: Verify node_modules exists**
```bash
ls -d ~/backend/gateway/node_modules/@nestjs/core
# Should show directory exists
```

**Check 4: Check if port 3000 is being used**
```bash
netstat -tulpn | grep 3000
# Should show node process listening on port 3000
```

### Issue: Gateway Starts But Immediately Stops

**Common causes**:
1. **Missing environment variables** → Add AUTHSERVICE_HOST, etc.
2. **Module not found** → Verify node_modules is extracted
3. **Syntax error in dist/main.js** → Check logs for errors
4. **Port conflict** → Check if another app is using port 3000

**Solution**: Check logs first:
```bash
tail -100 ~/backend/gateway/logs/gateway.log | grep -i error
```

---

## 📋 Complete Environment Variables Checklist

Make sure ALL these are set in cPanel:

```
PORT=3000
NODE_ENV=production
AUTHSERVICE_HOST=localhost
AUTHSERVICE_PORT=3001
ADMINSERVICE_HOST=localhost
ADMINSERVICE_PORT=3002
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
```

---

## 🎯 Quick Fix Commands

**If Gateway still won't start, try this via SSH**:

```bash
cd ~/backend/gateway

# Verify everything exists
echo "=== Verifying Gateway Setup ==="
[ -f dist/main.js ] && echo "✅ dist/main.js exists" || echo "❌ dist/main.js missing"
[ -d node_modules/@nestjs/core ] && echo "✅ node_modules exists" || echo "❌ node_modules missing"
[ -f package.json ] && echo "✅ package.json exists" || echo "❌ package.json missing"
[ -f .env ] && echo "✅ .env exists" || echo "❌ .env missing"

# Check .env content
if [ -f .env ]; then
    echo "=== .env content ==="
    cat .env
fi

# Test running manually (to see errors)
echo "=== Testing manual start ==="
export NODE_OPTIONS="--max-old-space-size=256 --max-semi-space-size=64"
export PORT=3000
export NODE_ENV=production
export AUTHSERVICE_HOST=localhost
export AUTHSERVICE_PORT=3001
export ADMINSERVICE_HOST=localhost
export ADMINSERVICE_PORT=3002

# Try to start (press Ctrl+C after a few seconds)
node dist/main.js
```

This will show you any startup errors.

---

## ✅ Success Indicators

Gateway is working when:

- ✅ `curl http://localhost:3000/health` returns response (not "Connection refused")
- ✅ Status in Node.js Selector shows "Running"
- ✅ No errors in logs
- ✅ Process visible: `ps aux | grep node | grep gateway`

---

## 🚀 After Gateway is Running

Once Gateway responds to `curl http://localhost:3000/health`:

1. ✅ Configure Auth Service (similar steps)
2. ✅ Configure Admin Service (similar steps)
3. ✅ Test API endpoints
4. ✅ Configure frontend .htaccess to proxy `/api/` to Gateway

---

**Start by adding the missing environment variables in cPanel, then restart the application!**

