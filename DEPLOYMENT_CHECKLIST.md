# ✅ cPanel Deployment Checklist

Use this checklist to ensure you complete all steps for a successful deployment.

## 📋 Pre-Deployment (Local)

### Environment Setup
- [ ] Node.js 16.x installed locally
- [ ] All dependencies installed (`npm install` in root and each service)
- [ ] CORS origins updated in all `main.ts` files with production domain
- [ ] Frontend API endpoints updated for production
- [ ] gRPC hosts updated to `localhost` (if using gRPC)

### Build Process
- [ ] Run build script: `.\scripts\build-for-cpanel.ps1` (Windows) or `./scripts/build-for-cpanel.sh` (Linux/Mac)
- [ ] Verify `deployment/` folder created with all packages
- [ ] Check all zip files are present:
  - [ ] `frontend-build.zip`
  - [ ] `gateway.zip`
  - [ ] `authservice.zip`
  - [ ] `adminservice.zip`
- [ ] Review `.env.example` files

## 🗄️ Database Setup (cPanel)

### PostgreSQL Configuration
- [ ] PostgreSQL 13.22 available/configured
- [ ] Database `earnings_authdb` created
- [ ] Database `earnings_admindb` created
- [ ] Database user created (e.g., `earnings_user`)
- [ ] User granted ALL PRIVILEGES on both databases
- [ ] Database connection details noted (host, port, username, password)

### Schema Import
- [ ] Auth database schema imported (via Prisma migrations or SQL)
- [ ] Admin database schema imported (via Prisma migrations or SQL)
- [ ] Prisma clients generated: `npx prisma generate` (for both services)
- [ ] Initial data seeded (if applicable)

## 📤 File Upload (cPanel)

### Frontend
- [ ] `frontend-build.zip` uploaded to server
- [ ] Extracted to `public_html/` (or subdirectory)
- [ ] File permissions set correctly (644 for files, 755 for directories)
- [ ] `.htaccess` file created/updated

### Backend Services
- [ ] `gateway.zip` uploaded and extracted to `~/backend/gateway/`
- [ ] `authservice.zip` uploaded and extracted to `~/backend/authservice2/`
- [ ] `adminservice.zip` uploaded and extracted to `~/backend/adminservice/`
- [ ] Verify structure: each service has `dist/`, `package.json`, `prisma/` (where applicable), `proto/`

## ⚙️ Server Configuration

### Environment Variables
- [ ] `.env` file created in `~/backend/gateway/` from template
- [ ] `.env` file created in `~/backend/authservice2/` from template
- [ ] `.env` file created in `~/backend/adminservice/` from template
- [ ] All placeholder values replaced with actual production values:
  - [ ] Database URLs updated
  - [ ] JWT secrets changed from defaults
  - [ ] API keys configured
  - [ ] Domain URLs updated

### Dependencies Installation
- [ ] Gateway: `npm install --production` completed
- [ ] Auth Service: `npm install --production` completed
- [ ] Admin Service: `npm install --production` completed
- [ ] Auth Service: `npx prisma generate` completed
- [ ] Admin Service: `npx prisma generate` completed

### Node.js Applications (cPanel Node.js Selector)
- [ ] Gateway application created:
  - [ ] Node.js version: 16.x
  - [ ] Application root: `~/backend/gateway`
  - [ ] Startup file: `dist/main.js`
  - [ ] Environment variables added
  - [ ] Application started

- [ ] Auth Service application created:
  - [ ] Node.js version: 16.x
  - [ ] Application root: `~/backend/authservice2`
  - [ ] Startup file: `dist/main.js`
  - [ ] Environment variables added
  - [ ] Application started

- [ ] Admin Service application created:
  - [ ] Node.js version: 16.x
  - [ ] Application root: `~/backend/adminservice`
  - [ ] Startup file: `dist/main.js`
  - [ ] Environment variables added
  - [ ] Application started

### Frontend Configuration
- [ ] `.htaccess` file created/updated in `public_html/`
- [ ] Rewrite rules configured for SPA routing
- [ ] Security headers configured (optional)

### SSL Certificate
- [ ] SSL certificate installed (Let's Encrypt or other)
- [ ] HTTPS redirect enabled
- [ ] All API endpoints use HTTPS

## 🧪 Testing & Verification

### Backend Services
- [ ] Gateway health check: `curl http://localhost:3000/api/health`
- [ ] Auth Service health check: `curl http://localhost:3001/api/auth/health`
- [ ] Admin Service health check: `curl http://localhost:3002/api/admin/health`
- [ ] All services responding correctly

### Frontend
- [ ] Frontend loads: `https://yourdomain.com/`
- [ ] No console errors in browser
- [ ] API calls working (check Network tab)
- [ ] Static assets loading (CSS, JS files)

### Database
- [ ] Database connections working
- [ ] Can login/register users
- [ ] Data persists correctly
- [ ] Admin functionality working

### Application Features
- [ ] User authentication working
- [ ] User registration working
- [ ] Admin login working
- [ ] API endpoints responding
- [ ] File uploads working (if applicable)
- [ ] Chat functionality working (if applicable)

## 🔒 Security Checklist

- [ ] All default passwords changed
- [ ] JWT secrets are strong and unique
- [ ] Database passwords are strong
- [ ] API keys are configured
- [ ] CORS origins restricted to production domain
- [ ] SSL certificate installed and working
- [ ] Environment variables not exposed in logs
- [ ] File permissions set correctly
- [ ] `.env` files not accessible via web

## 📊 Monitoring & Maintenance

### Logs
- [ ] Application logs accessible
- [ ] Error logging configured
- [ ] Log rotation set up (if applicable)

### Backups
- [ ] Database backup strategy in place
- [ ] File backup strategy in place
- [ ] Backup schedule configured

### Performance
- [ ] CDN configured for static assets (optional)
- [ ] Database connection pooling configured
- [ ] Caching strategy implemented (if applicable)

## 🎯 Post-Deployment

- [ ] All services running smoothly
- [ ] No critical errors in logs
- [ ] Performance acceptable
- [ ] Users can access application
- [ ] Documentation updated with production URLs
- [ ] Team notified of deployment

## 🔄 Update Process (For Future Updates)

- [ ] Build updated code locally
- [ ] Upload new `dist/` folders
- [ ] Update dependencies if `package.json` changed
- [ ] Run migrations if database schema changed
- [ ] Restart Node.js applications
- [ ] Test updated functionality
- [ ] Verify no regressions

---

## 📝 Notes

- **Time Estimate**: ~45-60 minutes for first deployment
- **Difficulty**: Intermediate
- **Prerequisites**: cPanel access, Node.js 16, PostgreSQL 13.22

## 🆘 If Something Goes Wrong

1. Check application logs in Node.js Selector
2. Verify environment variables are correct
3. Check database connection
4. Review troubleshooting section in `CPANEL_DEPLOYMENT_NODE16_PG13.md`
5. Verify file permissions
6. Check Node.js version (must be 16.x)

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Production URL**: _______________
**Status**: ☐ Success  ☐ Issues Encountered

**Issues/Notes**:
_________________________________________________
_________________________________________________
_________________________________________________





