# 🚀 Complete cPanel Deployment Guide - Node 16 & PostgreSQL 13.22

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Preparation](#local-preparation)
3. [Build Process](#build-process)
4. [Database Setup](#database-setup)
5. [Server Upload](#server-upload)
6. [Server Configuration](#server-configuration)
7. [Testing & Verification](#testing--verification)
8. [Low Memory Optimization Tips](#phase-65-low-memory-optimization-tips)
9. [Troubleshooting](#phase-7-troubleshooting)
10. [Production Checklist](#production-checklist)
11. [Update Process](#update-process)
12. [Quick Reference](#quick-reference)

---

## 📋 Prerequisites

Before starting deployment, ensure you have:

- ✅ **cPanel Access** with SSH enabled
- ✅ **Node.js Selector** access in cPanel (for Node 16)
- ✅ **PostgreSQL 13.22** database access (cPanel PostgreSQL or remote)
- ✅ **Domain/Subdomain** configured
- ✅ **SSL Certificate** (Let's Encrypt recommended)
- ✅ **Local Development Environment** set up
- ✅ **Git** installed locally (for version control)

---

## 🏗️ Architecture Overview

Your application consists of:

1. **Frontend**: React + Vite application → Static files served via cPanel
2. **Backend Services**:
   - **Gateway Service** (Port 3000) - API Gateway
   - **Auth Service** (Port 3001) - Authentication & User Management
   - **Admin Service** (Port 3002) - Admin & Stock Management
3. **Database**: PostgreSQL 13.22 (two databases: authdb & admindb)
4. **Redis**: Optional (for caching, can use in-memory if not available)

---

## ⚠️ CRITICAL DIFFERENCES - READ FIRST!

**Before starting deployment, note these critical differences:**

1. **Auth Service Startup File Path**:
   - ❌ **Wrong**: `dist/main.js`
   - ✅ **Correct**: `dist/src/main.js` (different from other services!)
   - Gateway and Admin Service use: `dist/main.js`
   - Auth Service uses: `dist/src/main.js`

2. **Seed File Paths**:
   - Auth Service: `dist/prisma/seed.js` (compiled) or `prisma/seed.js` (source)
   - Admin Service: `dist/prisma/seed.js` (compiled)

3. **Build Verification**:
   - Always verify startup files exist after build
   - If `dist/src/main.js` (Auth) or `dist/main.js` (Gateway/Admin) is missing, build failed

4. **Order Matters**:
   - Install dependencies (Step 5.2) and create .env files (Step 5.1) can be done in any order
   - Both must be completed BEFORE Node.js Selector setup (Step 5.3)
   - Verify startup files exist BEFORE Step 5.3

---

## 📦 Phase 1: Local Preparation

### Step 1.1: Verify Node.js Version

Ensure you're using Node.js 16 locally for compatibility:

```bash
# Check Node version
node --version  # Should be v16.x.x

# If not, install Node 16 using nvm
nvm install 16
nvm use 16
```

### Step 1.2: Update CORS Configuration

Update CORS settings in all backend services to include your production domain.

**File: `backend/gateway/src/main.ts`**
```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ],
  credentials: true,
});
```

**File: `backend/authservice2/src/main.ts`**
```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ],
  credentials: true,
});
```

**File: `backend/adminservice/src/main.ts`**
```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ],
  credentials: true,
});
```

### Step 1.3: Update Frontend API Configuration

**Important**: The frontend uses **relative API paths** (`/api/auth`, `/api/admin`, etc.), which means:
- ✅ **No changes needed** if frontend and Gateway API are on the same domain
- ✅ The Vite proxy configuration in `vite.config.ts` is **ONLY for development** (`npm run dev`)
- ✅ Production build makes direct API calls using relative paths

**Current Configuration** (No changes required):
- Frontend API calls use relative paths: `/api/auth`, `/api/admin`, `/api/stock`, etc.
- These will automatically resolve to: `https://yourdomain.com/api/...`
- WebSocket connections use `VITE_BACKEND_WS_URL` environment variable (if set)

**For Same-Domain Setup** (Recommended):
If frontend is at `https://yourdomain.com/` and Gateway is at `https://yourdomain.com/api/`:
- ✅ **No configuration changes needed**
- Relative paths will work automatically
- Ensure `.htaccess` proxy is configured (see Step 5.4)

**For Different-Domain Setup** (Advanced):
If API is on a different domain/subdomain:

1. **Create `.env.production`** in `frontend/earnings-calendar/`:
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com
   VITE_BACKEND_WS_URL=https://api.yourdomain.com
   ```

2. **Update API service files** to use environment variable (requires code changes):
   - Modify `src/services/authApi.ts` to use `import.meta.env.VITE_API_BASE_URL`
   - Modify `src/services/adminApi.ts` to use `import.meta.env.VITE_API_BASE_URL`
   - WebSocket already uses `import.meta.env.VITE_BACKEND_WS_URL`

**Note**: 
- The current codebase uses relative paths, which is the simplest approach
- If frontend and API share the same domain, use `.htaccess` proxy (see Step 5.4)
- Vite proxy in `vite.config.ts` is ignored in production builds

### Step 1.4: Update gRPC Hosts (if using gRPC)

Since services run on the same server, use `localhost`:

**File: `backend/gateway/src/grpc/auth.grpc.client.ts`** (if exists)
```typescript
url: 'localhost:50051'  // Instead of 'auth-service:50051'
```

**File: `backend/gateway/src/grpc/admin.grpc.client.ts`** (if exists)
```typescript
url: 'localhost:50052'  // Instead of 'adminservice:50052'
```

---

## 🔨 Phase 2: Build Process

### Step 2.1: Install Dependencies Locally

```bash
# Root directory
npm install

# Frontend
cd frontend/earnings-calendar
npm install
cd ../..

# Backend Services
cd backend/gateway
npm install
cd ../authservice2
npm install
cd ../adminservice
npm install
cd ../..
```

### Step 2.2: Build Frontend

```bash
cd frontend/earnings-calendar
npm run build
```

**Output**: `frontend/earnings-calendar/dist/` folder with production files

### Step 2.3: Build Backend Services

```bash
# Gateway Service
cd backend/gateway
npm run build

# Verify build output
[ -f dist/main.js ] && echo "✓ Gateway built successfully" || echo "✗ Gateway build failed"
cd ../..

# Auth Service
cd backend/authservice2
npm run build

# Verify build output (NOTE: Different path structure!)
[ -f dist/src/main.js ] && echo "✓ Auth service built successfully" || echo "✗ Auth service build failed"
cd ../..

# Admin Service
cd backend/adminservice
npm run build

# Verify build output
[ -f dist/main.js ] && echo "✓ Admin service built successfully" || echo "✗ Admin service build failed"
cd ../..
```

**Output**: Each service will have a `dist/` folder with compiled JavaScript

**⚠️ CRITICAL VERIFICATION**:
- **Gateway**: `backend/gateway/dist/main.js` must exist
- **Auth Service**: `backend/authservice2/dist/src/main.js` must exist (different path!)
- **Admin Service**: `backend/adminservice/dist/main.js` must exist

If any file is missing, check build errors and fix before proceeding.

### Step 2.4: Prepare Deployment Packages

Use the provided build script (see `scripts/build-for-cpanel.sh` or `scripts/build-for-cpanel.ps1`):

**For Windows (PowerShell):**
```powershell
# Ensure Node.js 16 is active
node --version  # Should be v16.x.x

# Run build script
.\scripts\build-for-cpanel.ps1
```

**For Linux/Mac (Bash):**
```bash
# Ensure Node.js 16 is active
node --version  # Should be v16.x.x

# Make script executable and run
chmod +x scripts/build-for-cpanel.sh
./scripts/build-for-cpanel.sh
```

**What the script creates:**
- `deployment/frontend-build.zip` - Frontend static files (index.html, assets/)
- `deployment/gateway.zip` - Gateway service (dist/, package.json, proto/)
- `deployment/authservice.zip` - Auth service (dist/, package.json, prisma/, proto/)
- `deployment/adminservice.zip` - Admin service (dist/, package.json, prisma/, proto/)
- `deployment/*.env.example` - Environment variable templates

**Verify Build Output:**
```bash
# Check deployment directory
ls -lh deployment/

# Verify zip file sizes (should be reasonable, not empty)
# Frontend: ~1-5MB (compressed static files)
# Services: ~500KB-2MB each (compiled JS + configs)
```

**Important**: 
- The build script excludes `node_modules` - dependencies will be installed on server
- Proto files are included for gRPC communication (if used)
- Prisma schemas are included for database migrations
- Ensure all builds completed without errors before proceeding

---

## 🗄️ Phase 3: Database Setup

### Step 3.1: Create PostgreSQL Databases

1. **Access cPanel PostgreSQL**
   - Login to cPanel
   - Navigate to **PostgreSQL Databases** (or **Remote PostgreSQL** if using external)

2. **Create Databases**
   - Database 1: `earnings_authdb`
   - Database 2: `earnings_admindb`

3. **Create Database User**
   - Username: `earnings_user` (or your preferred name)
   - Strong password (save this!)
   - Add user to both databases with **ALL PRIVILEGES**

4. **Note Connection Details**
   - Host: Usually `localhost` (or remote host if external)
   - Port: Usually `5432` (or custom port)
   - Database names and credentials

### Step 3.2: Import Database Schemas

**Option A: Using Prisma Migrations (Recommended)**

Via SSH:
```bash
# Connect to server
ssh username@yourdomain.com

# Set memory limit for Prisma operations
export NODE_OPTIONS="--max-old-space-size=512"

# Navigate to auth service
cd ~/backend/authservice2

# Generate Prisma Client first
npx prisma generate

# Deploy migrations (creates tables in PostgreSQL 13.22)
npx prisma migrate deploy

# Verify tables were created
npx prisma db pull  # Optional: verify schema matches

# Navigate to admin service
cd ~/backend/adminservice

# Generate Prisma Client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

# Verify tables were created
npx prisma db pull  # Optional: verify schema matches

# Verify tables exist in database
psql $DATABASE_URL -c "\dt" || echo "Warning: Could not list tables (connection issue?)"
```

**Verify Migrations Completed Successfully**:
```bash
# Check if migrations were applied
cd ~/backend/authservice2
npx prisma migrate status

# Should show: "Database schema is up to date" or list applied migrations
# If errors occur, check DATABASE_URL and database permissions

# Repeat for admin service
cd ~/backend/adminservice
npx prisma migrate status
```

**Troubleshooting Prisma with PostgreSQL 13.22**:
- If migrations fail, check PostgreSQL version: `psql --version`
- Ensure Prisma version is 6.x or 7.x (compatible with PostgreSQL 13+)
- If connection fails, verify DATABASE_URL format:
  ```
  postgresql://username:password@host:port/database?connection_limit=5
  ```

**Option B: Manual SQL Import** (Fallback if Prisma fails)

1. **Access phpPgAdmin** in cPanel (or use psql via SSH)
2. **For Auth Database**:
   - Select `earnings_authdb`
   - Click **SQL** tab
   - Copy contents from `auth_schema.sql` (if available in repo)
   - Paste and execute
   - **Note**: Manual SQL may not include all Prisma migrations
3. **For Admin Database**:
   - Select `earnings_admindb`
   - Click **SQL** tab
   - Copy contents from `admin_schema.sql` (if available in repo)
   - Paste and execute

**Option C: Generate SQL from Prisma** (if you have access to migrations)
```bash
# On local machine with Node 16
cd backend/authservice2
npx prisma migrate dev --create-only --name init
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migrations.sql

# Upload migrations.sql to server and execute via phpPgAdmin
```

### Step 3.3: Seed Initial Data (Optional)

**Important**: Seed after migrations are complete and services are built.

```bash
# Auth Service
cd ~/backend/authservice2

# Option 1: Use compiled seed file (recommended)
node dist/prisma/seed.js

# Option 2: Use source seed file (if available)
# node prisma/seed.js

# Admin Service
cd ~/backend/adminservice

# Use compiled seed file
node dist/prisma/seed.js

# Verify superadmin was created
# Check logs or database to confirm
```

**Note**: 
- Seed files are compiled to `dist/prisma/seed.js` after build
- If seeding fails, ensure migrations completed successfully
- Superadmin credentials (if seeded): `sadmin@admin.com` / `Superadmin123!`

---

## 📤 Phase 4: Server Upload

### Step 4.1: Upload Frontend Files

1. **Access cPanel File Manager**
   - Login to cPanel
   - Open **File Manager**
   - Navigate to `public_html` (or your domain's root directory)

2. **Upload Frontend Build**
   - Upload `deployment/frontend-build.zip`
   - Extract in `public_html/` (or subdirectory)
   - **Important**: Extract ALL contents of the zip, not the folder itself
   - Structure should be:
     ```
     public_html/
     ├── index.html
     ├── assets/
     │   ├── index-[hash].js
     │   └── index-[hash].css
     └── ...
     ```

3. **Set Permissions**
   ```bash
   chmod 755 public_html
   chmod 644 public_html/index.html
   chmod -R 755 public_html/assets
   ```

### Step 4.2: Upload Backend Services

**Recommended: Upload via SSH/SCP (faster and more reliable)**

1. **Create Backend Directory Structure**
   ```bash
   # Via SSH
   ssh username@yourdomain.com
   mkdir -p ~/backend/{gateway,authservice2,adminservice}/logs
   ```

2. **Upload Each Service Zip File**
   
   **Option A: Via SCP (from local machine)**
   ```bash
   # From your local machine
   scp deployment/gateway.zip username@yourdomain.com:~/backend/
   scp deployment/authservice.zip username@yourdomain.com:~/backend/
   scp deployment/adminservice.zip username@yourdomain.com:~/backend/
   ```

   **Option B: Via cPanel File Manager**
   - Login to cPanel → File Manager
   - Navigate to `backend/` directory (create if it doesn't exist)
   - Upload each zip file: `gateway.zip`, `authservice.zip`, `adminservice.zip`
   - **Important**: Upload one at a time if you have upload size limits

3. **Extract Each Service**
   
   **Via SSH** (Recommended - faster):
   ```bash
   ssh username@yourdomain.com
   
   # Extract Gateway
   cd ~/backend
   unzip -q gateway.zip -d gateway
   rm gateway.zip  # Remove zip to save space
   
   # Extract Auth Service
   unzip -q authservice.zip -d authservice2
   rm authservice.zip
   
   # Extract Admin Service
   unzip -q adminservice.zip -d adminservice
   rm adminservice.zip
   ```

   **Via cPanel File Manager**:
   - Right-click each zip file → Extract
   - Extract to appropriate directory (gateway/, authservice2/, adminservice/)
   - Delete zip files after extraction to save disk space

4. **Verify Structure and Critical Files**
   ```bash
   # Via SSH - verify structure
   ssh username@yourdomain.com
   
   # Check directory structure
   ls -la ~/backend/*/
   
   # CRITICAL: Verify startup files exist (before proceeding to configuration)
   echo "=== Checking Startup Files ==="
   [ -f ~/backend/gateway/dist/main.js ] && echo "✓ Gateway: dist/main.js exists" || echo "✗ Gateway: dist/main.js MISSING"
   [ -f ~/backend/authservice2/dist/src/main.js ] && echo "✓ Auth Service: dist/src/main.js exists" || echo "✗ Auth Service: dist/src/main.js MISSING"
   [ -f ~/backend/adminservice/dist/main.js ] && echo "✓ Admin Service: dist/main.js exists" || echo "✗ Admin Service: dist/main.js MISSING"
   
   # Verify package.json files
   [ -f ~/backend/gateway/package.json ] && echo "✓ Gateway: package.json exists" || echo "✗ Gateway: package.json MISSING"
   [ -f ~/backend/authservice2/package.json ] && echo "✓ Auth Service: package.json exists" || echo "✗ Auth Service: package.json MISSING"
   [ -f ~/backend/adminservice/package.json ] && echo "✓ Admin Service: package.json exists" || echo "✗ Admin Service: package.json MISSING"
   ```
   
   Should look like:
   ```
   ~/backend/
   ├── gateway/
   │   ├── dist/
   │   │   └── main.js  ← CRITICAL: Must exist
   │   ├── package.json
   │   ├── proto/
   │   └── logs/ (empty, created above)
   ├── authservice2/
   │   ├── dist/
   │   │   └── src/
   │   │       └── main.js  ← CRITICAL: Different path, must exist
   │   ├── package.json
   │   ├── prisma/
   │   ├── proto/
   │   └── logs/ (empty, created above)
   └── adminservice/
       ├── dist/
       │   └── main.js  ← CRITICAL: Must exist
       ├── package.json
       ├── prisma/
       ├── proto/
       └── logs/ (empty, created above)
   ```
   
   **⚠️ If any startup file is missing, the build failed - DO NOT proceed. Rebuild the service.**

5. **Set Permissions**
   ```bash
   # Via SSH
   chmod -R 755 ~/backend
   chmod -R 777 ~/backend/*/logs  # Writable for log files
   ```

---

## ⚙️ Phase 5: Server Configuration

### Step 5.1: Configure Environment Variables

**⚠️ Important**: Create `.env` files BEFORE or AFTER Step 5.2 (install dependencies), but both must be completed before Step 5.3 (Node.js Selector setup).

Create `.env` files for each service on the server:

**Via SSH** (Recommended - use nano or vi):
```bash
ssh username@yourdomain.com

# Create Gateway .env
cd ~/backend/gateway
nano .env
# Paste content below, save (Ctrl+X, Y, Enter)

# Create Auth Service .env
cd ~/backend/authservice2
nano .env
# Paste content below, save

# Create Admin Service .env
cd ~/backend/adminservice
nano .env
# Paste content below, save
```

**Via cPanel File Manager**:
- Navigate to each service directory
- Create new file named `.env`
- Paste content, save

**Environment Files Content**:

**Gateway Service** (`~/backend/gateway/.env`):
```env
PORT=3000
NODE_ENV=production
AUTHSERVICE_HOST=localhost
AUTHSERVICE_PORT=3001
ADMINSERVICE_HOST=localhost
ADMINSERVICE_PORT=3002
# Low memory optimization
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
```

**Auth Service** (`~/backend/authservice2/.env`):
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://earnings_user:YOUR_PASSWORD@localhost:5432/earnings_authdb?connection_limit=5&pool_timeout=20
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=15m
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/oauth/google/callback
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=your-email@domain.com
# Low memory optimization
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
# PostgreSQL connection pool optimization
DATABASE_POOL_SIZE=5
```

**Admin Service** (`~/backend/adminservice/.env`):
```env
PORT=3002
NODE_ENV=production
DATABASE_URL=postgresql://earnings_user:YOUR_PASSWORD@localhost:5432/earnings_admindb?connection_limit=5&pool_timeout=20
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=30m
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this
REFRESH_TOKEN_EXPIRATION=7d
# Low memory optimization
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
# PostgreSQL connection pool optimization
DATABASE_POOL_SIZE=5
```

**Important Notes**:
- Replace `YOUR_PASSWORD` with actual database password
- Use strong, unique secrets for JWT_SECRET (minimum 32 characters)
- Update all placeholder values with actual credentials
- `NODE_OPTIONS` limits memory usage per service (adjust based on available RAM)
- PostgreSQL connection pool limits reduce memory usage (5 connections is safe for low-memory environments)
- If Redis is not available, you may need to modify code to use in-memory cache
- For PostgreSQL 13.22, the connection string syntax is compatible as shown above

### Step 5.2: Install Dependencies on Server

**⚠️ Important**: Install dependencies BEFORE creating .env files, or create .env files BEFORE installing (order doesn't matter, but both must be done before Step 5.3).

**Memory-Efficient Installation (Low Memory Environments)**

For low-memory servers, install dependencies one service at a time and clear npm cache between installations:

**Via SSH** (Recommended):
```bash
# Connect to server
ssh username@yourdomain.com

# Set npm to use less memory during installation
export NODE_OPTIONS="--max-old-space-size=512"

# Gateway Service
cd ~/backend/gateway
npm install --production --prefer-offline --no-audit
npm cache clean --force

# Verify installation
ls -d node_modules/@nestjs/core 2>/dev/null && echo "✓ Gateway dependencies installed" || echo "✗ Installation failed"

# Auth Service
cd ~/backend/authservice2
npm install --production --prefer-offline --no-audit
npx prisma generate
npm cache clean --force

# Verify installation and Prisma client
ls -d node_modules/@prisma/client 2>/dev/null && echo "✓ Auth dependencies installed" || echo "✗ Installation failed"
ls -d node_modules/.prisma 2>/dev/null && echo "✓ Prisma client generated" || echo "✗ Prisma generate failed"

# Admin Service
cd ~/backend/adminservice
npm install --production --prefer-offline --no-audit
npx prisma generate
npm cache clean --force

# Verify installation and Prisma client
ls -d node_modules/@prisma/client 2>/dev/null && echo "✓ Admin dependencies installed" || echo "✗ Installation failed"
ls -d node_modules/.prisma 2>/dev/null && echo "✓ Prisma client generated" || echo "✗ Prisma generate failed"

# Final cleanup
npm cache clean --force
```

**Alternative: Install Dependencies Locally Before Upload**

If server has very limited memory, install dependencies locally and include `node_modules` in upload:

1. **On Local Machine** (with Node 16):
```bash
cd backend/gateway
npm install --production
cd ../authservice2
npm install --production
npx prisma generate
cd ../adminservice
npm install --production
npx prisma generate
```

2. **Update Build Script** to include `node_modules` in zip files (for very low memory servers only)

**Via cPanel Terminal** (if SSH not available):
- Use cPanel Terminal feature
- Run same commands with memory flags
- Consider uploading pre-installed `node_modules` if installation fails

### Step 5.3: Configure Node.js Applications

**Important**: Configure applications one at a time to avoid memory issues.

1. **Access Node.js Selector**
   - cPanel → Software → Node.js Selector
   - Click **Create Application**

2. **Create Gateway Application**
   - **Node.js Version**: `16.x` (select Node 16)
   - **Application root**: `/home/username/backend/gateway`
   - **Application URL**: `api.yourdomain.com` (or your preferred subdomain)
   - **Application startup file**: `dist/main.js`
   - **Application mode**: Production
   - **Passenger log file**: `logs/gateway.log` (create logs directory first)
   - **Environment variables**: Add all from `.env` file manually (one per line):
     ```
     PORT=3000
     NODE_ENV=production
     AUTHSERVICE_HOST=localhost
     AUTHSERVICE_PORT=3001
     ADMINSERVICE_HOST=localhost
     ADMINSERVICE_PORT=3002
     NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
     ```
   - Click **Create**
   - **DO NOT** click "Run NPM Install" if already installed via SSH
   - Click **Start App**
   - Wait 30 seconds, then verify it's running

3. **Create Auth Service Application**
   - **Node.js Version**: `16.x`
   - **Application root**: `/home/username/backend/authservice2`
   - **Application URL**: `auth-api.yourdomain.com` (or internal port like `localhost:3001`)
   - **Application startup file**: `dist/src/main.js` ⚠️ **IMPORTANT**: Auth service uses different path!
   - **Application mode**: Production
   - **Passenger log file**: `logs/auth.log`
   - **Environment variables**: Add all from `.env` file:
     ```
     PORT=3001
     NODE_ENV=production
     DATABASE_URL=postgresql://earnings_user:PASSWORD@localhost:5432/earnings_authdb?connection_limit=5&pool_timeout=20
     REDIS_HOST=localhost
     REDIS_PORT=6379
     JWT_SECRET=your-secret-key
     JWT_EXPIRATION=15m
     GOOGLE_CLIENT_ID=your-google-client-id
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/oauth/google/callback
     RESEND_API_KEY=your-resend-api-key
     EMAIL_FROM=your-email@domain.com
     NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
     DATABASE_POOL_SIZE=5
     ```
   - Click **Create**
   - Click **Start App**
   - Wait 30 seconds, then verify it's running

4. **Create Admin Service Application**
   - **Node.js Version**: `16.x`
   - **Application root**: `/home/username/backend/adminservice`
   - **Application URL**: `admin-api.yourdomain.com` (or internal port like `localhost:3002`)
   - **Application startup file**: `dist/main.js`
   - **Application mode**: Production
   - **Passenger log file**: `logs/admin.log`
   - **Environment variables**: Add all from `.env` file:
     ```
     PORT=3002
     NODE_ENV=production
     DATABASE_URL=postgresql://earnings_user:PASSWORD@localhost:5432/earnings_admindb?connection_limit=5&pool_timeout=20
     REDIS_HOST=localhost
     REDIS_PORT=6379
     JWT_SECRET=your-secret-key
     JWT_EXPIRATION=30m
     REFRESH_TOKEN_SECRET=your-refresh-token-secret
     REFRESH_TOKEN_EXPIRATION=7d
     NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
     DATABASE_POOL_SIZE=5
     ```
   - Click **Create**
   - Click **Start App**
   - Wait 30 seconds, then verify it's running

**⚠️ CRITICAL: Verify Startup Files Before Creating Applications**

Before creating applications in Node.js Selector, verify startup files exist:

```bash
# Via SSH - verify startup files
ssh username@yourdomain.com

# Check Gateway
ls -la ~/backend/gateway/dist/main.js
# Should show: dist/main.js exists

# Check Auth Service (DIFFERENT PATH!)
ls -la ~/backend/authservice2/dist/src/main.js
# Should show: dist/src/main.js exists

# Check Admin Service
ls -la ~/backend/adminservice/dist/main.js
# Should show: dist/main.js exists
```

If any file is missing, the build failed - check build logs and rebuild.

**Important Notes**: 
- Create `logs` directories in each service folder before starting: `mkdir -p ~/backend/{gateway,authservice2,adminservice}/logs`
- **Auth Service uses `dist/src/main.js` (not `dist/main.js`)** - this is different from other services!
- Gateway and Admin Service use `dist/main.js`
- If using internal ports (3001, 3002), these services won't have public URLs - they're only accessible via Gateway
- For low-memory servers, start services one at a time with delays between starts

### Step 5.4: Configure Frontend .htaccess

Create/Update `public_html/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Handle React Router (SPA)
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
  
  # API Proxy - Forward /api requests to Gateway
  # Note: Use http:// for localhost, https:// not needed for internal proxy
  RewriteCond %{REQUEST_URI} ^/api/(.*)$
  RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]
  
  # Ensure proxy module is enabled (usually enabled by default)
  # If proxy doesn't work, contact hosting provider to enable mod_proxy
  
  # Security headers
  <IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
  </IfModule>
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

**Note**: Requires `mod_rewrite` and `mod_proxy` enabled (usually enabled by default)

### Step 5.5: Set Up SSL Certificate

1. **Access SSL/TLS Status**
   - cPanel → SSL/TLS Status
   - Select your domain
   - Click **Run AutoSSL** or install Let's Encrypt certificate

2. **Force HTTPS Redirect**
   - Enable **Force HTTPS Redirect**
   - Update all API endpoints to use `https://`

---

## 🧪 Phase 6: Testing & Verification

### Step 6.1: Test Backend Services

```bash
# Test Gateway
curl https://yourdomain.com/api/health
# or
curl http://localhost:3000/api/health

# Test Auth Service
curl http://localhost:3001/api/auth/health

# Test Admin Service
curl http://localhost:3002/api/admin/health
```

### Step 6.2: Test Frontend

1. Visit: `https://yourdomain.com/`
2. Check browser console for errors
3. Verify API calls are working
4. Test login functionality

### Step 6.3: Test Database Connection

1. Login to application
2. Verify user registration/login works
3. Check if data persists
4. Test admin functionality

### Step 6.4: Verify Logs

**Via Node.js Selector**:
- Click on each application
- View logs for errors

**Via SSH**:
```bash
# Check application logs
tail -f ~/backend/gateway/logs/app.log
tail -f ~/backend/authservice2/logs/app.log
tail -f ~/backend/adminservice/logs/app.log
```

---

## 💾 Phase 6.5: Low Memory Optimization Tips

### Memory Allocation Strategy

For servers with limited RAM (1-2GB), follow these optimizations:

1. **Node.js Memory Limits** (per service)
   ```bash
   # In .env files, adjust based on available RAM:
   # 1GB server: --max-old-space-size=256 (256MB per service)
   # 2GB server: --max-old-space-size=512 (512MB per service)
   # 4GB+ server: --max-old-space-size=1024 (1GB per service)
   NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
   ```

2. **PostgreSQL Connection Pooling**
   - Limit connections per service to 5 (default in .env files)
   - Total connections: 3 services × 5 = 15 connections (safe for low memory)
   - Connection string: `?connection_limit=5&pool_timeout=20`

3. **Installation Strategy**
   - Install dependencies one service at a time
   - Clear npm cache between installations
   - Use `--production` flag to skip dev dependencies
   - Consider pre-installing `node_modules` locally if server installation fails

4. **Runtime Memory Management**
   - Start services one at a time with delays (30 seconds between starts)
   - Monitor memory usage: `free -m` or `htop`
   - Stop unused services if needed
   - Use process manager if available (PM2, but check cPanel compatibility)

5. **Database Optimization for PostgreSQL 13.22**
   ```sql
   -- Connect to database and run these queries if you have access:
   -- Reduce shared_buffers (only if you have direct DB access)
   ALTER SYSTEM SET shared_buffers = '128MB';  -- Default might be 256MB+
   ALTER SYSTEM SET work_mem = '4MB';          -- Default might be higher
   ALTER SYSTEM SET maintenance_work_mem = '32MB';
   ```

6. **Disk Space Management**
   - Delete zip files after extraction
   - Remove `node_modules` source maps if not needed: `find node_modules -name "*.map" -delete`
   - Regularly clean log files
   - Monitor disk usage: `df -h`

---

## 🔧 Phase 7: Troubleshooting

### Pre-Troubleshooting Checklist

Before troubleshooting, verify these basics:

```bash
# 1. Check Node.js version (must be 16.x)
node --version

# 2. Verify startup files exist
ls -la ~/backend/gateway/dist/main.js
ls -la ~/backend/authservice2/dist/src/main.js  # Different path!
ls -la ~/backend/adminservice/dist/main.js

# 3. Check if dependencies are installed
ls -d ~/backend/*/node_modules 2>/dev/null

# 4. Verify .env files exist
ls -la ~/backend/*/.env

# 5. Check database connectivity
psql -h localhost -U earnings_user -d earnings_authdb -c "SELECT 1;" 2>&1

# 6. Check if services are running
ps aux | grep node | grep -E "(gateway|authservice2|adminservice)"
```

### Common Issues & Solutions

#### 1. Node.js App Not Starting

**Symptoms**: Application fails to start in Node.js Selector

**Solutions**:
```bash
# Verify Node.js version is 16.x
node --version

# Verify startup files exist (NOTE: Auth service path is different!)
ls -la ~/backend/gateway/dist/main.js
ls -la ~/backend/authservice2/dist/src/main.js  # Different path!
ls -la ~/backend/adminservice/dist/main.js

# Verify environment variables are set correctly in Node.js Selector
# Check application logs in Node.js Selector

# Ensure all dependencies are installed
cd ~/backend/gateway && npm list --depth=0
cd ~/backend/authservice2 && npm list --depth=0
cd ~/backend/adminservice && npm list --depth=0
```

#### 2. Database Connection Failed

**Symptoms**: `ECONNREFUSED` or `Connection refused` errors

**Solutions**:
- Verify `DATABASE_URL` is correct
- Check database credentials
- Ensure database server allows connections from localhost
- Verify PostgreSQL is running: `pg_isready -h localhost`
- Check firewall rules

#### 3. Prisma Client Not Generated

**Symptoms**: `PrismaClient is not initialized` error

**Solutions**:
```bash
# Set memory limit for Prisma generate
export NODE_OPTIONS="--max-old-space-size=512"

cd ~/backend/authservice2
npx prisma generate

# Verify Prisma client was generated
[ -d node_modules/.prisma ] && echo "✓ Prisma client generated" || echo "✗ Generation failed"

cd ~/backend/adminservice
npx prisma generate

# Verify Prisma client was generated
[ -d node_modules/.prisma ] && echo "✓ Prisma client generated" || echo "✗ Generation failed"
```

#### 4. CORS Errors

**Symptoms**: CORS policy errors in browser console

**Solutions**:
- Update CORS origin in all services' `main.ts` files
- Rebuild services after CORS changes
- Ensure credentials are enabled
- Verify API endpoints use HTTPS

#### 5. Static Files Not Loading

**Symptoms**: 404 errors for CSS/JS files

**Solutions**:
- Check file permissions: `chmod 644` for files, `chmod 755` for directories
- Verify `.htaccess` is correct
- Check if `mod_rewrite` is enabled
- Verify file paths in `index.html`

#### 6. Port Conflicts

**Symptoms**: `EADDRINUSE` error

**Solutions**:
- Check if ports 3000, 3001, 3002 are available
- Stop conflicting applications
- Use different ports if needed (update `.env` files)

#### 7. Module Not Found Errors

**Symptoms**: `Cannot find module '@nestjs/core'` or similar

**Solutions**:
```bash
cd ~/backend/gateway
rm -rf node_modules package-lock.json
npm install --production

# Repeat for other services
```

#### 8. PostgreSQL Version Compatibility

**Symptoms**: Prisma migration errors with PostgreSQL 13.22

**Solutions**:
- Ensure Prisma Client version is compatible with PostgreSQL 13.22 (Prisma 6.x supports PostgreSQL 13+)
- Check Prisma schema for PostgreSQL 13.22 compatible features
- Run: `npx prisma migrate resolve --applied <migration_name>` if needed
- Verify PostgreSQL version: `psql --version` (should show 13.22)
- Test connection: `psql -h localhost -U earnings_user -d earnings_authdb`

#### 9. Low Memory Issues

**Symptoms**: 
- Application crashes with "JavaScript heap out of memory"
- npm install fails with memory errors
- Services won't start

**Solutions**:
```bash
# Check available memory
free -m

# Reduce Node.js memory limit in .env files
# Change from: NODE_OPTIONS=--max-old-space-size=512
# To: NODE_OPTIONS=--max-old-space-size=256

# Install dependencies with memory limit
export NODE_OPTIONS="--max-old-space-size=512"
npm install --production --prefer-offline --no-audit

# If installation still fails, install locally and upload node_modules
# (See Step 5.2 for alternative installation method)

# Check process memory usage
ps aux | grep node
```

#### 10. Upload Size Limits

**Symptoms**: Cannot upload zip files (size too large)

**Solutions**:
- **Option A**: Split upload using tar.gz with compression:
  ```bash
  # On local machine, create compressed archives
  cd deployment
  tar -czf gateway.tar.gz -C gateway .
  tar -czf authservice.tar.gz -C authservice2 .
  tar -czf adminservice.tar.gz -C adminservice .
  ```
- **Option B**: Upload via SCP/SSH (bypasses web upload limits)
- **Option C**: Use FTP/SFTP client instead of cPanel File Manager
- **Option D**: Upload components separately (dist/, package.json, prisma/, proto/)

#### 11. Prisma Generate Fails (Low Memory)

**Symptoms**: `npx prisma generate` fails or hangs

**Solutions**:
```bash
# Generate with memory limit
export NODE_OPTIONS="--max-old-space-size=512"
npx prisma generate

# If still fails, generate locally and upload generated client
# Prisma Client location: node_modules/@prisma/client
# Upload this folder to server
```

#### 12. PostgreSQL 13.22 Connection Pool Exhausted

**Symptoms**: "too many clients already" error

**Solutions**:
- Reduce connection pool size in DATABASE_URL: `?connection_limit=3` (instead of 5)
- Check active connections: 
  ```sql
  SELECT count(*) FROM pg_stat_activity;
  ```
- Restart PostgreSQL service if needed (contact hosting provider)
- Ensure connection pool timeouts are set: `?pool_timeout=20`

---

## 📝 Production Checklist

Before going live, verify:

### Pre-Deployment
- [ ] Node.js 16 verified locally
- [ ] All services built successfully (dist/ folders exist)
- [ ] Deployment packages created (zip files in deployment/)
- [ ] Build scripts completed without errors
- [ ] Environment variable templates reviewed

### Server Setup
- [ ] cPanel access with SSH enabled
- [ ] Node.js 16 available in Node.js Selector
- [ ] PostgreSQL 13.22 database access confirmed
- [ ] Two databases created (earnings_authdb, earnings_admindb)
- [ ] Database user created with proper permissions
- [ ] Frontend files uploaded to public_html/
- [ ] Backend services uploaded to ~/backend/
- [ ] All zip files extracted correctly
- [ ] Directory structure verified

### Configuration
- [ ] All environment variables configured correctly (Gateway, Auth, Admin)
- [ ] .env files created for all services
- [ ] Database connection strings verified
- [ ] JWT secrets changed from defaults (minimum 32 characters)
- [ ] CORS configured for production domain
- [ ] SSL certificate installed and working
- [ ] .htaccess file configured for frontend
- [ ] File permissions set correctly (755 for dirs, 644 for files)

### Database
- [ ] Prisma clients generated (npx prisma generate)
- [ ] Database migrations run successfully (npx prisma migrate deploy)
- [ ] Tables created in both databases
- [ ] Database seeded with initial data (if needed)
- [ ] PostgreSQL 13.22 compatibility verified
- [ ] Connection pooling configured (limit=5)

### Services
- [ ] All Node.js applications created in Node.js Selector
- [ ] All applications started successfully
- [ ] Gateway running on port 3000
- [ ] Auth Service running on port 3001
- [ ] Admin Service running on port 3002
- [ ] Health endpoints responding (if available)
- [ ] Logs directories created and writable

### Frontend
- [ ] Frontend API endpoints updated (point to production)
- [ ] Static files loading correctly (CSS, JS)
- [ ] React Router working (SPA routing)
- [ ] No console errors in browser
- [ ] HTTPS redirect working

### Testing
- [ ] Frontend accessible at https://yourdomain.com
- [ ] API Gateway accessible at https://yourdomain.com/api/
- [ ] User registration works
- [ ] User login works
- [ ] Database persistence verified (data saves correctly)
- [ ] Admin functionality tested
- [ ] OAuth login works (if configured)

### Security & Performance
- [ ] All secrets changed from defaults
- [ ] HTTPS enforced
- [ ] Security headers configured (.htaccess)
- [ ] Memory limits configured (NODE_OPTIONS)
- [ ] Connection pooling optimized for low memory
- [ ] Error logging configured
- [ ] Backup strategy in place
- [ ] Monitoring set up (optional but recommended)

### Post-Deployment
- [ ] Application tested end-to-end
- [ ] Performance acceptable (response times)
- [ ] Memory usage within limits (check with free -m)
- [ ] Disk space sufficient (check with df -h)
- [ ] Logs checked for errors
- [ ] All services stable (no crashes)

---

## 🔄 Update Process

When updating the application:

1. **Build Locally**
   ```bash
   cd frontend/earnings-calendar && npm run build
   cd backend/gateway && npm run build
   cd backend/authservice2 && npm run build
   cd backend/adminservice && npm run build
   ```

2. **Upload New Files**
   - Upload new `dist` folders (replace old ones)
   - Upload updated `package.json` if dependencies changed

3. **Install Dependencies** (if package.json changed)
   ```bash
   cd ~/backend/gateway && npm install --production
   cd ~/backend/authservice2 && npm install --production
   cd ~/backend/adminservice && npm install --production
   ```

4. **Run Migrations** (if schema changed)
   ```bash
   cd ~/backend/authservice2 && npx prisma migrate deploy
   cd ~/backend/adminservice && npx prisma migrate deploy
   ```

5. **Restart Applications**
   - Via Node.js Selector: Click "Restart App" for each service
   - Or via SSH: Restart Node.js processes

---

## 📞 Additional Resources

- **cPanel Documentation**: https://docs.cpanel.net/
- **Node.js Selector Guide**: Check cPanel documentation
- **Prisma Migrations**: https://www.prisma.io/docs/concepts/components/prisma-migrate
- **PostgreSQL 13.22 Documentation**: https://www.postgresql.org/docs/13/

---

## ⚠️ Important Notes

1. **Redis**: If Redis is not available on cPanel:
   - Use a remote Redis service (Redis Cloud, etc.)
   - Or modify code to use in-memory cache (not recommended for production)

2. **gRPC**: gRPC may not work in cPanel environment:
   - Consider using HTTP REST instead
   - Or set up gRPC via reverse proxy

3. **File Uploads**: Ensure upload directory has write permissions:
   ```bash
   chmod 755 ~/backend/adminservice/uploads
   ```

4. **Logs**: Check application logs regularly:
   - Node.js Selector → View Logs
   - Or via SSH: Check log files

5. **Performance**: Consider:
   - CDN for static assets
   - Database connection pooling
   - Caching strategies
   - Load balancing (if needed)

---

## 🎯 Quick Reference

### URLs
- **Frontend URL**: `https://yourdomain.com/`
- **Gateway API**: `https://yourdomain.com/api/` or `https://api.yourdomain.com/`
- **Auth Service**: `http://localhost:3001/` (internal, not publicly accessible)
- **Admin Service**: `http://localhost:3002/` (internal, not publicly accessible)

### Credentials
**Default Admin Credentials** (after seeding):
- Email: `sadmin@admin.com`
- Password: `Superadmin123!` (**⚠️ Change in production!**)

### Versions
- **Node.js Version**: 16.x (required)
- **PostgreSQL Version**: 13.22 (required)
- **Prisma Version**: 6.x or 7.x (compatible with PostgreSQL 13+)

### Directory Structure
```
~/backend/
├── gateway/
│   ├── dist/
│   │   └── main.js  ← Startup file
│   ├── package.json
│   ├── proto/
│   ├── .env
│   ├── node_modules/
│   └── logs/
├── authservice2/
│   ├── dist/
│   │   └── src/
│   │       └── main.js  ← Startup file (DIFFERENT PATH!)
│   ├── package.json
│   ├── prisma/
│   ├── proto/
│   ├── .env
│   ├── node_modules/
│   └── logs/
└── adminservice/
    ├── dist/
    │   └── main.js  ← Startup file
    ├── package.json
    ├── prisma/
    ├── proto/
    ├── .env
    ├── node_modules/
    └── logs/
```

**⚠️ Important**: Auth Service uses `dist/src/main.js` while Gateway and Admin Service use `dist/main.js`

### Memory Configuration (Low Memory Servers)
```bash
# Per service memory limit
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64

# Database connection pool
DATABASE_URL=postgresql://...?connection_limit=5&pool_timeout=20
```

### Key Commands
```bash
# Install dependencies (low memory)
export NODE_OPTIONS="--max-old-space-size=512"
npm install --production --prefer-offline --no-audit

# Prisma operations
npx prisma generate
npx prisma migrate deploy

# Check memory usage
free -m

# Check disk space
df -h

# Check Node.js processes
ps aux | grep node

# View logs
tail -f ~/backend/*/logs/*.log
```

### Common Ports
- Gateway: 3000
- Auth Service: 3001
- Admin Service: 3002
- PostgreSQL: 5432 (default)
- Redis: 6379 (if available)

---

**Good luck with your deployment! 🚀**

**Need Help?**
- Check Troubleshooting section (Phase 7)
- Review Low Memory Optimization Tips (Phase 6.5)
- Verify Production Checklist (before going live)


