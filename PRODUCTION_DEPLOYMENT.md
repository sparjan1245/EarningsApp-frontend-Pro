# 🚀 Production Deployment Guide - sdnsoftech.info

## Complete Production Deployment Instructions

This guide provides step-by-step instructions for deploying the Earnings App to production on sdnsoftech.info.

---

## 📋 Prerequisites

- **VPS Server** with Ubuntu 20.04/22.04
- **Root SSH Access** to the server
- **Domain Name** pointing to your VPS IP (sdnsoftech.info)
- **GitHub Repository Access**

---

## 🎯 Quick Deployment (Automated)

### Step 1: SSH into Your Server

```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Run Deployment Script

```bash
# Clone repository
git clone https://github.com/sparjan1245/EarningsApp-frontend-Pro.git /var/www/earnings-app
cd /var/www/earnings-app

# Make script executable
chmod +x deploy-production.sh

# Run deployment
./deploy-production.sh
```

The script will:
- ✅ Install all required software (Node.js, PM2, Nginx, PostgreSQL, Redis)
- ✅ Setup firewall
- ✅ Build all services
- ✅ Configure PM2
- ✅ Setup Nginx with SSL
- ✅ Start all services

---

## 🔧 Manual Deployment Steps

### Step 1: Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2
pm2 startup systemd -u root --hp /root

# Install Nginx
apt install -y nginx

# Install PostgreSQL Client
apt install -y postgresql-client

# Install Redis
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Install Certbot
apt install -y certbot python3-certbot-nginx

# Setup Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### Step 2: Clone Repository

```bash
mkdir -p /var/www/earnings-app
cd /var/www
git clone https://github.com/sparjan1245/EarningsApp-frontend-Pro.git earnings-app
cd earnings-app
```

### Step 3: Install Dependencies

```bash
cd backend/gateway && npm ci --production && cd ../..
cd backend/authservice2 && npm ci --production && cd ../..
cd backend/adminservice && npm ci --production && cd ../..
```

### Step 4: Build Services

```bash
cd backend/gateway && npm run build && cd ../..
cd backend/authservice2 && npm run build && cd ../..
cd backend/adminservice && npm run build && cd ../..
```

### Step 5: Setup Environment Variables

```bash
# Copy example file
cp env.production.example .env.production

# Edit with your values
nano .env.production
```

**Required values to update:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong random string (min 32 chars)
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `RESEND_API_KEY` - From Resend dashboard
- All other configuration values

### Step 6: Database Setup

```bash
# Connect to PostgreSQL and create databases
sudo -u postgres psql

# In PostgreSQL:
CREATE DATABASE earnings_authdb;
CREATE DATABASE earnings_admindb;
CREATE USER earnings_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE earnings_authdb TO earnings_user;
GRANT ALL PRIVILEGES ON DATABASE earnings_admindb TO earnings_user;
\q

# Run migrations
cd backend/authservice2
npx prisma generate
npx prisma migrate deploy
cd ../..

cd backend/adminservice
npx prisma generate
npx prisma migrate deploy
cd ../..
```

### Step 7: Start Services with PM2

```bash
# Create logs directory
mkdir -p /var/www/earnings-app/logs

# Start services
cd /var/www/earnings-app
pm2 start ecosystem.config.js
pm2 save
```

### Step 8: Configure Nginx

```bash
# Copy nginx config
cp nginx/sdnsoftech.conf /etc/nginx/sites-available/sdnsoftech.conf
ln -s /etc/nginx/sites-available/sdnsoftech.conf /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

### Step 9: Setup SSL Certificate

```bash
# Obtain SSL certificate
certbot --nginx -d sdnsoftech.info -d www.sdnsoftech.info

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (choose Yes)
```

### Step 10: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check service logs
pm2 logs

# Test health endpoint
curl http://localhost:3000/health

# Test from browser
# Visit: https://sdnsoftech.info
```

---

## 🔍 Troubleshooting

### Services Not Starting

```bash
# Check PM2 logs
pm2 logs gateway
pm2 logs auth-service
pm2 logs adminservice

# Check if ports are in use
netstat -tulpn | grep -E '3000|3001|3002'

# Restart services
pm2 restart all
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U earnings_user -d earnings_authdb -h localhost

# Check PostgreSQL is running
systemctl status postgresql

# Check connection string in .env.production
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Check Redis is running
systemctl status redis-server

# Check Redis host/port in .env.production
```

### gRPC Connection Issues

```bash
# Check gRPC ports are accessible
netstat -tulpn | grep -E '50051|50052'

# Verify environment variables
cat .env.production | grep GRPC

# Check service logs for gRPC errors
pm2 logs | grep -i grpc
```

### Nginx Issues

```bash
# Check nginx configuration
nginx -t

# Check nginx logs
tail -f /var/log/nginx/sdnsoftech-error.log
tail -f /var/log/nginx/sdnsoftech-access.log

# Reload nginx
systemctl reload nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
certbot certificates

# Renew certificate manually
certbot renew

# Test SSL
openssl s_client -connect sdnsoftech.info:443
```

---

## 📊 Monitoring & Maintenance

### View Logs

```bash
# All services
pm2 logs

# Specific service
pm2 logs gateway
pm2 logs auth-service
pm2 logs adminservice

# Nginx logs
tail -f /var/log/nginx/sdnsoftech-error.log
```

### Restart Services

```bash
# Restart all
pm2 restart all

# Restart specific service
pm2 restart gateway

# Reload (zero downtime)
pm2 reload gateway
```

### Update Application

```bash
cd /var/www/earnings-app
git pull origin main

# Rebuild services
cd backend/gateway && npm run build && cd ../..
cd backend/authservice2 && npm run build && cd ../..
cd backend/adminservice && npm run build && cd ../..

# Restart services
pm2 restart all
```

### Database Backup

```bash
# Backup auth database
pg_dump -U earnings_user -d earnings_authdb > backup_auth_$(date +%Y%m%d).sql

# Backup admin database
pg_dump -U earnings_user -d earnings_admindb > backup_admin_$(date +%Y%m%d).sql
```

---

## ✅ Verification Checklist

- [ ] All services running: `pm2 status`
- [ ] Health endpoint working: `curl http://localhost:3000/health`
- [ ] HTTPS working: `https://sdnsoftech.info`
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] Redis connections working
- [ ] gRPC communication working
- [ ] SSL certificate valid
- [ ] Nginx routing correctly
- [ ] No errors in logs

---

## 🔐 Security Checklist

- [ ] Strong passwords for database
- [ ] Strong JWT secrets (32+ characters)
- [ ] Firewall configured (UFW)
- [ ] SSL certificate installed
- [ ] HTTPS redirect enabled
- [ ] Security headers configured
- [ ] Environment variables secured (.env.production)
- [ ] Regular backups scheduled

---

## 📞 Support

If you encounter issues:

1. Check logs: `pm2 logs` and nginx logs
2. Verify environment variables: `cat .env.production`
3. Test individual services: `curl http://localhost:3000/health`
4. Check service status: `pm2 status`
5. Review this guide for common issues

---

**🎉 Your application is now deployed and ready for production!**

