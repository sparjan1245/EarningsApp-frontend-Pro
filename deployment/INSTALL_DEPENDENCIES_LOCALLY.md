# 💾 Install Dependencies Locally and Upload to Server

Since your cPanel server has very low memory, the best solution is to install dependencies on your local machine and upload them.

---

## ✅ Solution: Install Locally and Upload

### Step 1: Install Dependencies Locally (On Your Windows Machine)

**Prerequisites**: Make sure you have Node.js 16 installed locally

```powershell
# Navigate to your project
cd E:\SP\new\EarningsApp-frontend-dev

# Gateway Service
cd backend\gateway
Write-Host "Installing Gateway dependencies..." -ForegroundColor Cyan
npm install --production --omit=dev
Write-Host "✓ Gateway dependencies installed" -ForegroundColor Green

# Auth Service
cd ..\authservice2
Write-Host "Installing Auth Service dependencies..." -ForegroundColor Cyan
npm install --production --omit=dev
Write-Host "Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate
Write-Host "✓ Auth Service dependencies installed" -ForegroundColor Green

# Admin Service
cd ..\adminservice
Write-Host "Installing Admin Service dependencies..." -ForegroundColor Cyan
npm install --production --omit=dev
Write-Host "Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate
Write-Host "✓ Admin Service dependencies installed" -ForegroundColor Green

cd ..\..
```

---

### Step 2: Create Compressed Archives of node_modules

**Option A: Using PowerShell (Windows)**

```powershell
# Gateway
cd backend\gateway
Compress-Archive -Path node_modules -DestinationPath ..\..\deployment\gateway-node_modules.zip -Force
Write-Host "✓ Gateway node_modules archived" -ForegroundColor Green

# Auth Service
cd ..\authservice2
Compress-Archive -Path node_modules -DestinationPath ..\..\deployment\authservice-node_modules.zip -Force
Write-Host "✓ Auth Service node_modules archived" -ForegroundColor Green

# Admin Service
cd ..\adminservice
Compress-Archive -Path node_modules -DestinationPath ..\..\deployment\adminservice-node_modules.zip -Force
Write-Host "✓ Admin Service node_modules archived" -ForegroundColor Green

cd ..\..
```

**Option B: Using tar (if you have Git Bash or WSL)**

```bash
cd backend/gateway
tar -czf ../../deployment/gateway-node_modules.tar.gz node_modules

cd ../authservice2
tar -czf ../../deployment/authservice-node_modules.tar.gz node_modules

cd ../adminservice
tar -czf ../../deployment/adminservice-node_modules.tar.gz node_modules
```

---

### Step 3: Upload Archives to Server

**Using SCP from your local machine**:

```powershell
# From your local machine (PowerShell or Git Bash)
# Replace with your actual server details

# Upload Gateway
scp deployment\gateway-node_modules.zip nailartsdesign@66-116-197-185:~/backend/gateway/

# Upload Auth Service
scp deployment\authservice-node_modules.zip nailartsdesign@66-116-197-185:~/backend/authservice2/

# Upload Admin Service
scp deployment\adminservice-node_modules.zip nailartsdesign@66-116-197-185:~/backend/adminservice/
```

**Or use cPanel File Manager**:
1. Upload each zip file via cPanel File Manager
2. Navigate to respective service directories
3. Extract there

---

### Step 4: Extract on Server

**Via SSH**:

```bash
# Connect to server
ssh nailartsdesign@66-116-197-185

# Gateway
cd ~/backend/gateway
unzip -q gateway-node_modules.zip
rm gateway-node_modules.zip
ls -d node_modules/@nestjs/core && echo "✓ Gateway node_modules extracted" || echo "✗ Extraction failed"

# Auth Service
cd ~/backend/authservice2
unzip -q authservice-node_modules.zip
rm authservice-node_modules.zip
ls -d node_modules/@prisma/client && echo "✓ Auth Service node_modules extracted" || echo "✗ Extraction failed"

# Admin Service
cd ~/backend/adminservice
unzip -q adminservice-node_modules.zip
rm adminservice-node_modules.zip
ls -d node_modules/@prisma/client && echo "✓ Admin Service node_modules extracted" || echo "✗ Extraction failed"
```

---

### Step 5: Verify Installation

```bash
# Check if node_modules exist
ls -d ~/backend/*/node_modules && echo "✅ All node_modules installed"

# Verify Prisma clients (for services with Prisma)
ls -d ~/backend/authservice2/node_modules/.prisma && echo "✅ Auth Prisma client exists"
ls -d ~/backend/adminservice/node_modules/.prisma && echo "✅ Admin Prisma client exists"

# Check disk space
df -h ~/backend
```

---

## 🎯 Complete PowerShell Script (Run on Your Local Machine)

Save this as `install-and-upload-dependencies.ps1`:

```powershell
# Install and Upload Dependencies Script
$ErrorActionPreference = "Stop"

Write-Host "🚀 Installing dependencies locally..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check Node version
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
if ($nodeVersion -notmatch "^v16") {
    Write-Host "⚠️  Warning: Node.js 16 is recommended" -ForegroundColor Yellow
}

# Gateway
Write-Host "`n📦 Gateway Service..." -ForegroundColor Yellow
cd backend\gateway
npm install --production --omit=dev
Compress-Archive -Path node_modules -DestinationPath ..\..\deployment\gateway-node_modules.zip -Force
Write-Host "✓ Gateway complete" -ForegroundColor Green

# Auth Service
Write-Host "`n📦 Auth Service..." -ForegroundColor Yellow
cd ..\authservice2
npm install --production --omit=dev
npx prisma generate
Compress-Archive -Path node_modules -DestinationPath ..\..\deployment\authservice-node_modules.zip -Force
Write-Host "✓ Auth Service complete" -ForegroundColor Green

# Admin Service
Write-Host "`n📦 Admin Service..." -ForegroundColor Yellow
cd ..\adminservice
npm install --production --omit=dev
npx prisma generate
Compress-Archive -Path node_modules -DestinationPath ..\..\deployment\adminservice-node_modules.zip -Force
Write-Host "✓ Admin Service complete" -ForegroundColor Green

cd ..\..

Write-Host "`n=====================================" -ForegroundColor Green
Write-Host "✅ All dependencies installed and archived!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Upload zip files to server via SCP or cPanel File Manager"
Write-Host "2. Extract on server in respective service directories"
Write-Host "3. Verify node_modules exist"
Write-Host "`nFiles created in deployment/ folder:" -ForegroundColor Cyan
Get-ChildItem deployment\*-node_modules.zip | Format-Table Name, @{Label="Size (MB)"; Expression={[math]::Round($_.Length/1MB, 2)}}
```

---

## ⚠️ Important Notes

1. **File Size**: node_modules folders can be large (50-200MB each)
   - Make sure you have enough disk space on server
   - Check with: `df -h ~/backend` before uploading

2. **Node.js Version Compatibility**: 
   - Dependencies must be installed with same Node.js version as server (Node 16)
   - Verify: `node --version` should be v16.x.x

3. **Prisma Clients**:
   - Prisma clients are platform-specific
   - If your local machine is Windows and server is Linux, Prisma might need regeneration
   - You can regenerate on server: `npx prisma generate`

4. **Platform Differences**:
   - If server is Linux and local is Windows, you might need to regenerate native modules
   - Most packages should work, but if errors occur, try: `npm rebuild` on server

---

## 🔄 Alternative: If Archives Are Too Large

If zip files are too large to upload:

1. **Split into smaller archives** (using 7-Zip or similar)
2. **Upload via FTP/SFTP** instead of SCP
3. **Use rsync** if available: `rsync -avz node_modules/ user@server:~/backend/gateway/node_modules/`

---

## ✅ After Uploading node_modules

Once node_modules are on the server, you can:

1. ✅ Skip `npm install` steps
2. ✅ Generate Prisma clients (if needed): `npx prisma generate`
3. ✅ Run migrations: `npx prisma migrate deploy`
4. ✅ Start applications in Node.js Selector

**Good luck! This should work on your low-memory server.** 🚀




