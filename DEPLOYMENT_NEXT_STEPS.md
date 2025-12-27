# 🚀 Deployment Next Steps Guide

Follow these steps after running the build script to deploy your application to cPanel.

---

## 📋 Step-by-Step Deployment Process

### Step 1: Review .env.example Files and Update with Production Values

**Location**: `deployment/` folder

1. **Review each .env.example file**:
   ```powershell
   # View files
   Get-Content deployment\gateway.env.example
   Get-Content deployment\authservice.env.example
   Get-Content deployment\adminservice.env.example
   ```

2. **Create production .env files** (keep these secure, never commit to git):
   ```powershell
   # Copy example files (you'll edit these on the server)
   Copy-Item deployment\gateway.env.example deployment\gateway.env.production
   Copy-Item deployment\authservice.env.example deployment\authservice.env.production
   Copy-Item deployment\adminservice.env.example deployment\adminservice.env.production
   ```

3. **Update with your production values**:
   - Replace `yourdomain.com` with your actual domain
   - Replace database credentials (`user`, `password`, database names)
   - Generate strong JWT secrets (minimum 32 characters)
   - Add your Google OAuth credentials
   - Add your Resend API key
   - Adjust `NODE_OPTIONS` based on server RAM

---

### Step 2: Upload Packages to Your cPanel Server

**Option A: Via SCP (Recommended - Faster)**

```powershell
# From your local machine
# Replace 'username' and 'yourdomain.com' with your actual values

# Upload frontend
scp deployment\frontend-build.zip username@yourdomain.com:~/

# Upload backend services
scp deployment\gateway.zip username@yourdomain.com:~/backend/
scp deployment\authservice.zip username@yourdomain.com:~/backend/
scp deployment\adminservice.zip username@yourdomain.com:~/backend/
```

**Option B: Via cPanel File Manager**

1. Login to cPanel
2. Open **File Manager**
3. Navigate to:
   - `public_html/` for frontend
   - `backend/` for backend services (create if doesn't exist)
4. Click **Upload** and select each zip file
5. Upload one at a time if you have size limits

---

### Step 3: Extract Files in Appropriate Directories

**Via SSH (Recommended)**:

```bash
# Connect to server
ssh username@yourdomain.com

# Create directory structure
mkdir -p ~/backend/{gateway,authservice2,adminservice}/logs

# Extract Frontend (in public_html)
cd ~/public_html
unzip -q ~/frontend-build.zip
# Ensure files are extracted directly, not in a subdirectory
# Should see: index.html, assets/ folder at root level

# Extract Backend Services
cd ~/backend

# Extract Gateway
unzip -q gateway.zip -d gateway
rm gateway.zip

# Extract Auth Service
unzip -q authservice.zip -d authservice2
rm authservice.zip

# Extract Admin Service
unzip -q adminservice.zip -d adminservice
rm adminservice.zip

# Clean up frontend zip
rm ~/frontend-build.zip
```

**Via cPanel File Manager**:
1. Navigate to `public_html/`
2. Right-click `frontend-build.zip` → Extract
3. Repeat for each backend zip in `backend/` directory
4. Delete zip files after extraction

---

### Step 4: Create .env Files from .env.example Templates

**Via SSH**:

```bash
# Connect to server
ssh username@yourdomain.com

# Copy example files
cp ~/backend/gateway/package.json ~/backend/gateway/.env.example 2>/dev/null || echo "Note: .env.example might not be in zip, create manually"
cp ~/backend/authservice2/package.json ~/backend/authservice2/.env.example 2>/dev/null || echo "Note: .env.example might not be in zip, create manually"
cp ~/backend/adminservice/package.json ~/backend/adminservice/.env.example 2>/dev/null || echo "Note: .env.example might not be in zip, create manually"

# Create .env files using nano editor
cd ~/backend/gateway
nano .env
# Paste gateway.env.example content, edit values, save (Ctrl+X, Y, Enter)

cd ~/backend/authservice2
nano .env
# Paste authservice.env.example content, edit values, save

cd ~/backend/adminservice
nano .env
# Paste adminservice.env.example content, edit values, save
```

**Or upload .env files from local**:

```powershell
# From your local machine (if you created .env.production files)
scp deployment\gateway.env.production username@yourdomain.com:~/backend/gateway/.env
scp deployment\authservice.env.production username@yourdomain.com:~/backend/authservice2/.env
scp deployment\adminservice.env.production username@yourdomain.com:~/backend/adminservice/.env
```

**⚠️ IMPORTANT**: Edit the .env files with your actual production values:
- Database credentials
- JWT secrets (generate strong random strings)
- Domain URLs
- API keys
- Adjust memory settings based on server RAM

---

### Step 5: Install Dependencies

**Via SSH**:

```bash
# Connect to server
ssh username@yourdomain.com

# Set memory limit for npm install
export NODE_OPTIONS="--max-old-space-size=512"

# Install Gateway dependencies
cd ~/backend/gateway
npm install --production --prefer-offline --no-audit
npm cache clean --force

# Install Auth Service dependencies
cd ~/backend/authservice2
npm install --production --prefer-offline --no-audit
npm cache clean --force

# Install Admin Service dependencies
cd ~/backend/adminservice
npm install --production --prefer-offline --no-audit
npm cache clean --force

# Final cleanup
npm cache clean --force
```

**Verify installation**:
```bash
# Check if node_modules exist
ls -d ~/backend/*/node_modules 2>/dev/null && echo "✓ Dependencies installed" || echo "✗ Installation failed"
```

---

### Step 6: Generate Prisma Clients

**Via SSH**:

```bash
# Connect to server
ssh username@yourdomain.com

# Set memory limit
export NODE_OPTIONS="--max-old-space-size=512"

# Generate Prisma Client for Auth Service
cd ~/backend/authservice2
npx prisma generate

# Verify generation
[ -d node_modules/.prisma ] && echo "✓ Auth Prisma client generated" || echo "✗ Generation failed"

# Generate Prisma Client for Admin Service
cd ~/backend/adminservice
npx prisma generate

# Verify generation
[ -d node_modules/.prisma ] && echo "✓ Admin Prisma client generated" || echo "✗ Generation failed"
```

---

### Step 7: Run Database Migrations

**Prerequisites**: 
- PostgreSQL 13.22 database must be created
- Databases: `earnings_authdb` and `earnings_admindb`
- Database user with proper permissions

**Via SSH**:

```bash
# Connect to server
ssh username@yourdomain.com

# Set memory limit
export NODE_OPTIONS="--max-old-space-size=512"

# Run migrations for Auth Service
cd ~/backend/authservice2
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Run migrations for Admin Service
cd ~/backend/adminservice
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

**Verify migrations**:
```bash
# Check if tables were created (requires psql)
# For auth database
psql $DATABASE_URL -c "\dt" 2>/dev/null || echo "Note: Check database manually"

# Or use Prisma Studio (if needed for verification)
# npx prisma studio (runs on http://localhost:5555)
```

**Optional: Seed initial data**:
```bash
# Seed Auth Service (creates superadmin user)
cd ~/backend/authservice2
node dist/prisma/seed.js

# Seed Admin Service (if available)
cd ~/backend/adminservice
node dist/prisma/seed.js 2>/dev/null || echo "No seed file available"
```

---

### Step 8: Configure Node.js Applications in cPanel

1. **Access Node.js Selector**:
   - Login to cPanel
   - Navigate to: **Software** → **Node.js Selector**
   - Click **Create Application**

2. **Create Gateway Application**:
   - **Node.js Version**: Select `16.x`
   - **Application root**: `/home/username/backend/gateway`
   - **Application URL**: `api.yourdomain.com` (or your preferred subdomain)
   - **Application startup file**: `dist/main.js` ⚠️
   - **Application mode**: Production
   - **Passenger log file**: `logs/gateway.log`
   - **Environment variables**: Add all variables from `.env` file (one per line)
   - Click **Create**
   - Click **Start App**
   - Wait 30 seconds, verify it's running

3. **Create Auth Service Application**:
   - **Node.js Version**: `16.x`
   - **Application root**: `/home/username/backend/authservice2`
   - **Application URL**: `auth-api.yourdomain.com` (or `localhost:3001` for internal)
   - **Application startup file**: `dist/src/main.js` ⚠️ **DIFFERENT PATH!**
   - **Application mode**: Production
   - **Passenger log file**: `logs/auth.log`
   - **Environment variables**: Add all from `.env` file
   - Click **Create**
   - Click **Start App**
   - Wait 30 seconds, verify it's running

4. **Create Admin Service Application**:
   - **Node.js Version**: `16.x`
   - **Application root**: `/home/username/backend/adminservice`
   - **Application URL**: `admin-api.yourdomain.com` (or `localhost:3002` for internal)
   - **Application startup file**: `dist/main.js` ⚠️
   - **Application mode**: Production
   - **Passenger log file**: `logs/admin.log`
   - **Environment variables**: Add all from `.env` file
   - Click **Create**
   - Click **Start App**
   - Wait 30 seconds, verify it's running

**⚠️ CRITICAL**: 
- Auth Service uses `dist/src/main.js` (different from others!)
- Gateway and Admin Service use `dist/main.js`
- Verify startup files exist before creating applications

---

### Step 9: Configure Frontend (.htaccess)

**Create/Update `public_html/.htaccess`**:

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
  RewriteCond %{REQUEST_URI} ^/api/(.*)$
  RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]
  
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

---

### Step 10: Set Up SSL Certificate

1. **Access SSL/TLS Status**:
   - cPanel → **SSL/TLS Status**
   - Select your domain
   - Click **Run AutoSSL** or install Let's Encrypt certificate

2. **Force HTTPS Redirect**:
   - Enable **Force HTTPS Redirect**
   - All API endpoints should use `https://`

---

### Step 11: Verify Deployment

**Test Backend Services**:
```bash
# Test Gateway
curl https://yourdomain.com/api/health
# or
curl http://localhost:3000/api/health

# Test Auth Service (if accessible)
curl http://localhost:3001/api/auth/health

# Test Admin Service (if accessible)
curl http://localhost:3002/api/admin/health
```

**Test Frontend**:
1. Visit: `https://yourdomain.com/`
2. Check browser console for errors
3. Verify API calls are working
4. Test login functionality

**Check Logs**:
```bash
# Via SSH
tail -f ~/backend/gateway/logs/gateway.log
tail -f ~/backend/authservice2/logs/auth.log
tail -f ~/backend/adminservice/logs/admin.log

# Or via Node.js Selector
# Click on each application → View Logs
```

---

## 📝 Quick Verification Checklist

- [ ] All .env files created with production values
- [ ] Frontend files extracted to `public_html/`
- [ ] Backend services extracted to `~/backend/`
- [ ] Startup files verified (`dist/main.js` or `dist/src/main.js`)
- [ ] Dependencies installed (`node_modules` exist)
- [ ] Prisma clients generated (`node_modules/.prisma` exist)
- [ ] Database migrations completed successfully
- [ ] All three Node.js applications created in Node.js Selector
- [ ] All applications started and running
- [ ] .htaccess configured for frontend
- [ ] SSL certificate installed
- [ ] Frontend accessible at `https://yourdomain.com`
- [ ] API Gateway responding
- [ ] Database connections working

---

## 🆘 Troubleshooting

If you encounter issues, refer to:
- **CPANEL_DEPLOYMENT_NODE16_PG13.md** - Full deployment guide with troubleshooting
- **Phase 7: Troubleshooting** section in the deployment guide
- Check application logs in Node.js Selector
- Verify file paths (especially Auth Service: `dist/src/main.js`)

---

## 📞 Need Help?

Common issues:
1. **Startup file not found**: Verify build completed successfully
2. **Database connection failed**: Check DATABASE_URL in .env file
3. **Memory errors**: Reduce NODE_OPTIONS values
4. **Port conflicts**: Verify ports 3000, 3001, 3002 are available
5. **CORS errors**: Update CORS origins in service main.ts files

**Good luck with your deployment! 🚀**




