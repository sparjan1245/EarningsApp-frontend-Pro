# ⚡ Quick Start Guide - VPS Deployment

**Fastest way to deploy Earnings App to Hostinger VPS**

## 🎯 Prerequisites

- ✅ VPS server with SSH access
- ✅ Git repository URL
- ✅ 30-60 minutes

## 🚀 10-Step Deployment

### Step 1: Connect to VPS
```bash
# Using PuTTY (Windows) or SSH (Linux/Mac)
ssh username@your-vps-ip
```

### Step 2: Clone Repository
```bash
cd ~
git clone <your-repo-url> EarningsApp
cd EarningsApp
```

### Step 3: Make Scripts Executable
```bash
cd deployment
chmod +x *.sh
```

### Step 4: Run Server Setup
```bash
bash vps-setup.sh
```
⏱️ Takes 5-10 minutes

### Step 5: Setup Databases
```bash
bash setup-databases.sh
```
📝 **Save the password you enter!**

### Step 6: Configure Environment Files
```bash
cd ~/EarningsApp

# Copy example files
cp deployment/gateway.env.example backend/gateway/.env
cp deployment/authservice.env.example backend/authservice2/.env
cp deployment/adminservice.env.example backend/adminservice/.env

# Edit each file (use the database password from Step 5)
nano backend/gateway/.env
nano backend/authservice2/.env
nano backend/adminservice/.env
```

**Required changes in each file:**
- Replace `your_secure_password` with the password from Step 5
- Replace `change-this-to-a-strong-random-string` with a strong random string (32+ characters)
- Update other values as needed (Google OAuth, Resend API key, etc.)

### Step 7: Install & Build
```bash
cd ~/EarningsApp
bash deployment/install-and-build.sh
```
⏱️ Takes 10-20 minutes

### Step 8: Seed Databases
```bash
bash deployment/seed-databases.sh
```

**Default Admin Login:**
- Email: `sadmin@admin.com`
- Password: `Superadmin123!`

### Step 9: Create PM2 Config & Start Services
```bash
bash deployment/create-pm2-config.sh
bash deployment/start-services.sh
```

### Step 10: Setup Auto-Start
```bash
pm2 startup
# Copy and run the command PM2 outputs
```

## ✅ Verify Deployment

```bash
# Check services
pm2 status

# Check logs
pm2 logs --lines 50

# Test endpoints
curl http://localhost:3000
curl http://localhost:3001/api
curl http://localhost:3002/api
```

## 🎉 Done!

Your application should now be running!

**Next Steps (Optional):**
- Configure Nginx (see main deployment guide)
- Setup SSL certificate (see main deployment guide)
- Change default admin password

## 🆘 Troubleshooting

**Services not starting?**
```bash
pm2 logs --err
```

**Database connection issues?**
```bash
psql -U earnings_user -d earnings_authdb -h localhost
```

**Need more help?**
See: [HOSTINGER_VPS_DEPLOYMENT.md](../HOSTINGER_VPS_DEPLOYMENT.md)



