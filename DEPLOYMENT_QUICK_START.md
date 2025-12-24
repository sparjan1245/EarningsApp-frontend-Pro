# 🚀 Quick Start Deployment Guide - cPanel (Node 16 & PostgreSQL 13.22)

This is a condensed version of the full deployment guide. For detailed instructions, see `CPANEL_DEPLOYMENT_NODE16_PG13.md`.

## ⚡ Quick Steps

### 1. Local Build (5-10 minutes)

```bash
# Windows PowerShell
.\scripts\build-for-cpanel.ps1

# Linux/Mac
chmod +x scripts/build-for-cpanel.sh
./scripts/build-for-cpanel.sh
```

**Output**: `deployment/` folder with all packages

### 2. Database Setup (5 minutes)

1. **cPanel → PostgreSQL Databases**
   - Create: `earnings_authdb`
   - Create: `earnings_admindb`
   - Create user: `earnings_user` (with password)
   - Grant ALL PRIVILEGES to both databases

2. **Import Schemas** (via phpPgAdmin or SSH):
   ```bash
   # Via SSH (recommended)
   cd ~/backend/authservice2
   npx prisma migrate deploy
   npx prisma generate
   
   cd ~/backend/adminservice
   npx prisma migrate deploy
   npx prisma generate
   ```

### 3. Upload Files (10 minutes)

1. **Frontend**: Upload `deployment/frontend-build.zip` → Extract to `public_html/`
2. **Backend**: Upload service zips → Extract to `~/backend/`:
   - `gateway.zip` → `~/backend/gateway/`
   - `authservice.zip` → `~/backend/authservice2/`
   - `adminservice.zip` → `~/backend/adminservice/`

### 4. Configure Environment (5 minutes)

Create `.env` files in each service directory using `.env.example` templates:

```bash
# Gateway
cd ~/backend/gateway
cp gateway.env.example .env
# Edit .env with your values

# Auth Service
cd ~/backend/authservice2
cp authservice.env.example .env
# Edit .env with DATABASE_URL and secrets

# Admin Service
cd ~/backend/adminservice
cp adminservice.env.example .env
# Edit .env with DATABASE_URL and secrets
```

### 5. Install Dependencies (5 minutes)

```bash
# Gateway
cd ~/backend/gateway
npm install --production

# Auth Service
cd ~/backend/authservice2
npm install --production
npx prisma generate

# Admin Service
cd ~/backend/adminservice
npm install --production
npx prisma generate
```

### 6. Configure Node.js Apps (10 minutes)

**cPanel → Node.js Selector → Create Application**

For each service:
- **Node Version**: 16.x
- **App Root**: `~/backend/[service-name]`
- **Startup File**: `dist/main.js`
- **Environment Variables**: Copy from `.env` file
- **Click**: Create → Run NPM Install → Start App

### 7. Configure Frontend (2 minutes)

Create `public_html/.htaccess`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### 8. Test (5 minutes)

```bash
# Test services
curl http://localhost:3000/api/health  # Gateway
curl http://localhost:3001/api/auth/health  # Auth
curl http://localhost:3002/api/admin/health  # Admin

# Test frontend
# Visit: https://yourdomain.com/
```

## ✅ Checklist

- [ ] Built all services locally
- [ ] Created PostgreSQL databases
- [ ] Imported database schemas
- [ ] Uploaded all files to server
- [ ] Created .env files with correct values
- [ ] Installed dependencies
- [ ] Generated Prisma clients
- [ ] Configured Node.js applications in cPanel
- [ ] Created .htaccess for frontend
- [ ] Tested all services
- [ ] SSL certificate installed

## 🆘 Common Issues

**"Cannot find module"**: Run `npm install --production` in service directory

**"Prisma Client not initialized"**: Run `npx prisma generate`

**"Database connection failed"**: Check DATABASE_URL in .env file

**"CORS errors"**: Update CORS origins in `main.ts` files and rebuild

## 📞 Need Help?

See `CPANEL_DEPLOYMENT_NODE16_PG13.md` for detailed troubleshooting and explanations.

---

**Total Time**: ~45 minutes
**Difficulty**: Intermediate


