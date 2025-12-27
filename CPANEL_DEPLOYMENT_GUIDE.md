# 🚀 cPanel Deployment Guide for Earnings Calendar Application

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ cPanel access with SSH enabled
- ✅ Node.js Selector access in cPanel (for running NestJS services)
- ✅ PostgreSQL database access (cPanel MySQL/PostgreSQL or remote database)
- ✅ Domain/subdomain configured
- ✅ SSL certificate (Let's Encrypt recommended)

---

## 🏗️ Architecture Overview for cPanel

Since cPanel doesn't support Docker, we'll deploy:
1. **Frontend**: Built React app (static files) → served via cPanel's public_html
2. **Backend Services**: Node.js applications → run via Node.js Selector
3. **Database**: PostgreSQL (remote or cPanel managed)
4. **Redis**: Optional (if available) or use in-memory cache

---

## 📦 Step 1: Prepare Your Application Locally

### 1.1 Build Frontend for Production

```bash
# Navigate to frontend directory
cd frontend/earnings-calendar

# Install dependencies (if not already done)
npm install

# Build for production
npm run build

# This creates a 'dist' folder with production-ready files
```

**Output**: `frontend/earnings-calendar/dist/` folder contains all static files

### 1.2 Prepare Backend Services

You'll need to build each backend service:

```bash
# Gateway Service
cd backend/gateway
npm install
npm run build

# Auth Service
cd ../authservice2
npm install
npm run build

# Admin Service
cd ../adminservice
npm install
npm run build
```

**Note**: Each service will have a `dist` folder with compiled JavaScript.

---

## 📤 Step 2: Upload Files to cPanel

### 2.1 Upload Frontend Files

1. **Access cPanel File Manager**
   - Login to cPanel
   - Open "File Manager"
   - Navigate to `public_html` (or your domain's root directory)

2. **Create Frontend Directory** (Optional - for subdomain)
   ```
   public_html/
   └── app/  (or your preferred name)
   ```

3. **Upload Frontend Build**
   - Compress the `dist` folder locally (zip)
   - Upload via File Manager or FTP
   - Extract in `public_html/app/` (or root)
   - **Important**: Upload ALL contents of `dist` folder, not the folder itself

4. **Verify Structure**
   ```
   public_html/app/
   ├── index.html
   ├── assets/
   │   ├── index-[hash].js
   │   └── index-[hash].css
   └── ... (other static files)
   ```

### 2.2 Upload Backend Services

1. **Create Backend Directory Structure**
   ```
   public_html/
   ├── app/              (Frontend)
   └── backend/          (Backend services)
       ├── gateway/
       ├── auth-service/
       └── admin-service/
   ```

2. **Upload Each Service**
   - For each service (gateway, auth-service, admin-service):
     - Upload the entire service folder
     - Include: `dist/`, `node_modules/`, `package.json`, `.env` (create this)
     - Upload `proto/` folder to each service that needs it

3. **File Structure on Server**
   ```
   public_html/
   ├── app/                    # Frontend static files
   │   ├── index.html
   │   └── assets/
   ├── backend/
   │   ├── gateway/
   │   │   ├── dist/
   │   │   ├── node_modules/
   │   │   ├── package.json
   │   │   ├── .env
   │   │   └── proto/
   │   ├── auth-service/
   │   │   ├── dist/
   │   │   ├── node_modules/
   │   │   ├── package.json
   │   │   ├── .env
   │   │   └── prisma/
   │   └── admin-service/
   │       ├── dist/
   │       ├── node_modules/
   │       ├── package.json
   │       ├── .env
   │       ├── proto/
   │       └── prisma/
   └── .htaccess              # For URL rewriting
   ```

---

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Create .env Files for Each Service

**Gateway Service** (`backend/gateway/.env`):
```env
PORT=3000
NODE_ENV=production
AUTHSERVICE_HOST=localhost
AUTHSERVICE_PORT=3001
ADMINSERVICE_HOST=localhost
ADMINSERVICE_PORT=3002
```

**Auth Service** (`backend/auth-service/.env`):
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRATION=15m
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/oauth/google/callback
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=your-email@domain.com
```

**Admin Service** (`backend/admin-service/.env`):
```env
PORT=3002
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRATION=30m
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRATION=7d
```

**Important Notes**:
- Replace all placeholder values with actual credentials
- Use strong, unique secrets for JWT_SECRET
- Database URL should point to your PostgreSQL instance
- If Redis is not available, you may need to modify code to use in-memory cache

---

## 🗄️ Step 4: Set Up Database

### 4.1 Create PostgreSQL Databases

**Option A: Using cPanel PostgreSQL** (if available)
1. Go to cPanel → PostgreSQL Databases
2. Create database: `earnings_authdb`
3. Create database: `earnings_admindb`
4. Create users and assign privileges
5. Note connection details

**Option B: Remote PostgreSQL**
- Use a managed PostgreSQL service (AWS RDS, DigitalOcean, etc.)
- Get connection string
- Update DATABASE_URL in .env files

### 4.2 Run Database Migrations

**Via SSH**:
```bash
# Connect via SSH
ssh username@yourdomain.com

# Navigate to auth service
cd ~/public_html/backend/auth-service
npx prisma migrate deploy
npx prisma generate

# Navigate to admin service
cd ~/public_html/backend/admin-service
npx prisma migrate deploy
npx prisma generate
```

**Via cPanel Terminal** (if SSH not available):
- Use cPanel Terminal feature
- Run same commands

### 4.3 Seed Initial Data

```bash
# Seed auth service
cd ~/public_html/backend/auth-service
node prisma/seed.js

# Seed admin service
cd ~/public_html/backend/admin-service
node prisma/seed.js
```

---

## 🚀 Step 5: Set Up Node.js Applications

### 5.1 Configure Node.js Selector

1. **Access Node.js Selector**
   - cPanel → Software → Node.js Selector
   - Click "Create Application"

2. **Create Gateway Application**
   - **Application root**: `/home/username/public_html/backend/gateway`
   - **Application URL**: `yourdomain.com` or `api.yourdomain.com`
   - **Application startup file**: `dist/main.js`
   - **Node.js version**: 18.x or 20.x (latest LTS)
   - **Environment variables**: Add from `.env` file
   - Click "Create"

3. **Create Auth Service Application**
   - **Application root**: `/home/username/public_html/backend/auth-service`
   - **Application URL**: `auth-api.yourdomain.com` (or use subdomain)
   - **Application startup file**: `dist/main.js`
   - **Node.js version**: Same as gateway
   - **Environment variables**: Add from `.env` file
   - Click "Create"

4. **Create Admin Service Application**
   - **Application root**: `/home/username/public_html/backend/admin-service`
   - **Application URL**: `admin-api.yourdomain.com` (or use subdomain)
   - **Application startup file**: `dist/main.js`
   - **Node.js version**: Same as gateway
   - **Environment variables**: Add from `.env` file
   - Click "Create"

### 5.2 Install Dependencies

For each Node.js application:
1. In Node.js Selector, click "NPM Install"
2. Or via SSH:
   ```bash
   cd ~/public_html/backend/gateway && npm install --production
   cd ~/public_html/backend/auth-service && npm install --production
   cd ~/public_html/backend/admin-service && npm install --production
   ```

### 5.3 Start Applications

1. In Node.js Selector, click "Run NPM Script"
2. Select: `start:prod` or `start`
3. Click "Run"
4. Verify applications are running (check logs)

**Alternative**: Use PM2 (if available via SSH)
```bash
npm install -g pm2
cd ~/public_html/backend/gateway && pm2 start dist/main.js --name gateway
cd ~/public_html/backend/auth-service && pm2 start dist/main.js --name auth-service
cd ~/public_html/backend/admin-service && pm2 start dist/main.js --name admin-service
pm2 save
pm2 startup
```

---

## 🌐 Step 6: Configure Frontend

### 6.1 Update API Endpoints

Before building, update frontend API configuration:

**File**: `frontend/earnings-calendar/src/services/adminApi.ts`

Update base URL:
```typescript
// Change from localhost to your production domain
const baseURL = 'https://yourdomain.com/api';
// or
const baseURL = 'https://api.yourdomain.com';
```

### 6.2 Configure .htaccess for Frontend

Create/Update `public_html/app/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /app/
  
  # Handle Angular/React Router
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /app/index.html [L]
  
  # Security headers
  <IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
    Header set X-XSS-Protection "1; mode=block"
  </IfModule>
</IfModule>
```

### 6.3 Configure CORS

Update backend services to allow your domain:

**Gateway Service** (`backend/gateway/src/main.ts`):
```typescript
app.enableCors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true,
});
```

**Auth Service** (`backend/auth-service/src/main.ts`):
```typescript
app.enableCors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true,
});
```

**Admin Service** (`backend/admin-service/src/main.ts`):
```typescript
app.enableCors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true,
});
```

---

## 🔒 Step 7: Set Up SSL Certificate

1. **Access SSL/TLS Status**
   - cPanel → SSL/TLS Status
   - Select your domain
   - Click "Run AutoSSL" or install Let's Encrypt certificate

2. **Force HTTPS**
   - Enable "Force HTTPS Redirect"
   - Update all API endpoints to use `https://`

---

## 🔄 Step 8: Configure Reverse Proxy (If Needed)

If your Node.js apps run on different ports, set up reverse proxy:

**Create** `public_html/.htaccess`:

```apache
# Gateway API Proxy
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]

# Auth Service Proxy (if needed)
RewriteCond %{REQUEST_URI} ^/auth/(.*)$
RewriteRule ^auth/(.*)$ http://localhost:3001/$1 [P,L]

# Admin Service Proxy (if needed)
RewriteCond %{REQUEST_URI} ^/admin/(.*)$
RewriteRule ^admin/(.*)$ http://localhost:3002/$1 [P,L]
```

**Note**: Requires `mod_proxy` and `mod_proxy_http` enabled.

---

## 🧪 Step 9: Test Deployment

### 9.1 Test Frontend
- Visit: `https://yourdomain.com/app/`
- Check if page loads
- Check browser console for errors

### 9.2 Test Backend Services
```bash
# Test Gateway
curl https://yourdomain.com/api/health

# Test Auth Service
curl https://yourdomain.com/auth/health

# Test Admin Service
curl https://yourdomain.com/admin/health
```

### 9.3 Test Database Connection
- Login to application
- Verify user registration/login works
- Check if data persists

---

## 🔧 Step 10: Troubleshooting

### Common Issues:

1. **Node.js App Not Starting**
   - Check Node.js version compatibility
   - Verify `dist/main.js` exists
   - Check application logs in Node.js Selector
   - Verify environment variables are set

2. **Database Connection Failed**
   - Verify DATABASE_URL is correct
   - Check if database server allows remote connections
   - Verify firewall rules

3. **CORS Errors**
   - Update CORS origin in all services
   - Check if credentials are enabled
   - Verify API endpoints use HTTPS

4. **Static Files Not Loading**
   - Check file permissions (644 for files, 755 for directories)
   - Verify .htaccess is correct
   - Check if mod_rewrite is enabled

5. **Port Conflicts**
   - Ensure ports 3000, 3001, 3002 are available
   - Check if other applications are using these ports

---

## 📝 Step 11: Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] Database seeded with initial data
- [ ] SSL certificate installed
- [ ] CORS configured for production domain
- [ ] Frontend API endpoints updated
- [ ] All Node.js applications running
- [ ] Error logging configured
- [ ] Backup strategy in place
- [ ] Monitoring set up (optional)

---

## 🔄 Step 12: Update Process

When updating the application:

1. **Build locally**
   ```bash
   cd frontend/earnings-calendar && npm run build
   cd backend/gateway && npm run build
   cd backend/auth-service && npm run build
   cd backend/admin-service && npm run build
   ```

2. **Upload new files** (replace old dist folders)

3. **Restart Node.js applications** (via Node.js Selector or PM2)

4. **Run migrations** (if schema changed)
   ```bash
   cd backend/auth-service && npx prisma migrate deploy
   cd backend/admin-service && npx prisma migrate deploy
   ```

---

## 📞 Additional Resources

- **cPanel Documentation**: https://docs.cpanel.net/
- **Node.js Selector Guide**: Check cPanel documentation
- **Prisma Migrations**: https://www.prisma.io/docs/concepts/components/prisma-migrate

---

## ⚠️ Important Notes

1. **Redis**: If Redis is not available on cPanel, you may need to:
   - Use a remote Redis service (Redis Cloud, etc.)
   - Or modify code to use in-memory cache (not recommended for production)

2. **gRPC**: gRPC may not work in cPanel environment. Consider:
   - Using HTTP REST instead
   - Or setting up gRPC via reverse proxy

3. **File Uploads**: Ensure upload directory has write permissions:
   ```bash
   chmod 755 ~/public_html/backend/admin-service/uploads
   ```

4. **Logs**: Check application logs regularly:
   - Node.js Selector → View Logs
   - Or via SSH: `pm2 logs`

5. **Performance**: Consider using:
   - CDN for static assets
   - Database connection pooling
   - Caching strategies

---

## 🎯 Quick Reference

**Frontend URL**: `https://yourdomain.com/app/`
**Gateway API**: `https://yourdomain.com/api/`
**Auth Service**: `https://yourdomain.com/auth/` (or subdomain)
**Admin Service**: `https://yourdomain.com/admin/` (or subdomain)

**Default Admin Credentials** (after seeding):
- Email: `sadmin@admin.com`
- Password: `Superadmin123!`

---

**Good luck with your deployment! 🚀**






