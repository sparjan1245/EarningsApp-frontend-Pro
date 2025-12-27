# 🚀 Deployment Scripts

Automated setup scripts for deploying Earnings App to Hostinger VPS.

## 📋 Available Scripts

### 1. `vps-setup.sh`
**Purpose:** Initial server setup  
**What it does:**
- Updates system packages
- Installs Node.js 18+
- Installs PostgreSQL
- Installs Redis
- Installs PM2
- Installs Nginx
- Configures firewall

**Usage:**
```bash
bash vps-setup.sh
```

---

### 2. `setup-databases.sh`
**Purpose:** Create PostgreSQL databases and user  
**What it does:**
- Creates `earnings_authdb` database
- Creates `earnings_admindb` database
- Creates `earnings_user` database user
- Grants necessary permissions

**Usage:**
```bash
bash setup-databases.sh
# You'll be prompted to enter a database password
```

**Important:** Save the password you enter! You'll need it for `.env` files.

---

### 3. `install-and-build.sh`
**Purpose:** Install dependencies and build all services  
**What it does:**
- Installs root dependencies (if package.json exists)
- Installs backend dependencies (gateway, authservice, adminservice)
- Installs frontend dependencies
- Builds all services
- Runs Prisma migrations

**Usage:**
```bash
# Run from project root
cd ~/EarningsApp
bash deployment/install-and-build.sh
```

**Prerequisites:**
- Repository cloned
- `.env` files created (can run without, but services won't work)

---

### 4. `seed-databases.sh`
**Purpose:** Seed databases with initial admin user  
**What it does:**
- Seeds auth service database
- Seeds admin service database
- Creates superadmin user

**Usage:**
```bash
# Run from project root
cd ~/EarningsApp
bash deployment/seed-databases.sh
```

**Default Admin Credentials:**
- Email: `sadmin@admin.com`
- Password: `Superadmin123!`
- Role: `SUPERADMIN`

**Prerequisites:**
- Databases created
- Applications built
- Migrations deployed

---

### 5. `create-pm2-config.sh`
**Purpose:** Create PM2 ecosystem configuration file  
**What it does:**
- Creates `logs/` directory
- Creates `ecosystem.config.js` with all services

**Usage:**
```bash
# Run from project root
cd ~/EarningsApp
bash deployment/create-pm2-config.sh
```

---

### 6. `start-services.sh`
**Purpose:** Start all services with PM2  
**What it does:**
- Starts all services using ecosystem.config.js
- Saves PM2 configuration
- Shows service status

**Usage:**
```bash
# Run from project root
cd ~/EarningsApp
bash deployment/start-services.sh
```

**Prerequisites:**
- `ecosystem.config.js` exists
- All services built
- `.env` files configured

---

### 7. `complete-setup.sh`
**Purpose:** Run complete automated setup  
**What it does:**
- Runs all setup scripts in sequence
- Prompts at key steps

**Usage:**
```bash
# Run from project root
cd ~/EarningsApp
bash deployment/complete-setup.sh
```

**Prerequisites:**
- Databases already created
- `.env` files already configured

---

## 🎯 Recommended Deployment Order

1. **Connect to VPS** via PuTTY
2. **Clone repository:**
   ```bash
   cd ~
   git clone <your-repo-url> EarningsApp
   cd EarningsApp
   ```
3. **Make scripts executable:**
   ```bash
   cd deployment
   chmod +x *.sh
   ```
4. **Run server setup:**
   ```bash
   bash vps-setup.sh
   ```
5. **Setup databases:**
   ```bash
   bash setup-databases.sh
   # Save the password!
   ```
6. **Configure .env files:**
   ```bash
   cd ~/EarningsApp
   cp deployment/gateway.env.example backend/gateway/.env
   cp deployment/authservice.env.example backend/authservice2/.env
   cp deployment/adminservice.env.example backend/adminservice/.env
   # Edit each file with your values
   nano backend/gateway/.env
   nano backend/authservice2/.env
   nano backend/adminservice/.env
   ```
7. **Install and build:**
   ```bash
   bash deployment/install-and-build.sh
   ```
8. **Seed databases:**
   ```bash
   bash deployment/seed-databases.sh
   ```
9. **Create PM2 config:**
   ```bash
   bash deployment/create-pm2-config.sh
   ```
10. **Start services:**
    ```bash
    bash deployment/start-services.sh
    ```
11. **Setup PM2 startup:**
    ```bash
    pm2 startup
    # Copy and run the command PM2 outputs
    ```
12. **Verify:**
    ```bash
    pm2 status
    pm2 logs
    ```

---

## 🔧 Troubleshooting

### Scripts won't run
```bash
# Make scripts executable
chmod +x *.sh
```

### Permission denied
```bash
# Use bash explicitly
bash script-name.sh
```

### Script fails at a step
- Check the error message
- Verify prerequisites are met
- See main deployment guide for manual steps

### Services won't start
- Check `.env` files are configured correctly
- Verify databases are created and accessible
- Check logs: `pm2 logs`

---

## 📝 Notes

- All scripts include error checking and colored output
- Scripts will stop on any error (set -e)
- Scripts check for prerequisites where possible
- Always run scripts from the correct directory

---

## 🔗 Related Documentation

- [HOSTINGER_VPS_DEPLOYMENT.md](../HOSTINGER_VPS_DEPLOYMENT.md) - Complete deployment guide
- [PRODUCTION_ENV_GUIDE.md](../PRODUCTION_ENV_GUIDE.md) - Environment variables guide



