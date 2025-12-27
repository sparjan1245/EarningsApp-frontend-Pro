# 🚀 Hostinger VPS Deployment Guide

Complete step-by-step guide for deploying the Earnings App to Hostinger VPS using PuTTY.

## ⚡ Quick Start Summary

**High-level overview of deployment steps:**

1. **Server Setup** - Install Node.js, PostgreSQL, Redis, PM2, Nginx
2. **Database Setup** - Create databases and users
3. **Clone Repository** - Get your code on the server
4. **Configure Environment** - Set up `.env` files with your credentials
5. **Install & Build** - Install dependencies and build all services
6. **Seed Databases** - Initialize with admin user
7. **Start Services** - Use PM2 to run all services
8. **Configure Nginx** - Set up reverse proxy (optional)
9. **Setup SSL** - Enable HTTPS with Let's Encrypt (optional)

**Estimated Time:** 30-60 minutes (depending on server speed and internet connection)

---

## 📋 Prerequisites

- Hostinger VPS with SSH access (via PuTTY)
- Domain name pointing to your VPS IP (optional but recommended)
- Git repository access (HTTPS or SSH)
- Node.js 18+ (will be installed)
- PostgreSQL database (will be installed)
- Redis (optional but recommended - will be installed)
- PM2 for process management (will be installed)
- Nginx for reverse proxy (optional but recommended - will be installed)

## 🏗️ Project Structure

```
EarningsApp-frontend-dev/
├── backend/
│   ├── gateway/          # API Gateway (Port 3000)
│   ├── authservice2/     # Authentication Service (Port 3001)
│   └── adminservice/     # Admin Service (Port 3002)
├── frontend/
│   └── earnings-calendar/ # React Frontend
└── deployment/           # Environment configuration files & setup scripts
    ├── vps-setup.sh      # Server setup automation
    ├── setup-databases.sh # Database setup automation
    ├── install-and-build.sh # Install & build automation
    ├── seed-databases.sh  # Database seeding automation
    ├── create-pm2-config.sh # PM2 config creation
    ├── start-services.sh # Start services automation
    └── complete-setup.sh # Complete automated setup
```

---

## 🤖 Automated Setup Using Scripts

**Recommended for first-time deployment!** These scripts automate most of the setup process.

### Prerequisites for Automated Setup

1. **Connect to your VPS via PuTTY**
2. **Clone your repository** (if not already done):
   ```bash
   cd ~
   git clone <your-repo-url> EarningsApp
   cd EarningsApp
   ```

### Step-by-Step Automated Setup

#### Step 1: Make Scripts Executable

```bash
cd ~/EarningsApp/deployment
chmod +x *.sh
```

#### Step 2: Run Server Setup

This installs Node.js, PostgreSQL, Redis, PM2, and Nginx:

```bash
bash vps-setup.sh
```

**What it does:**
- Updates system packages
- Installs Node.js 18+
- Installs PostgreSQL
- Installs Redis
- Installs PM2
- Installs Nginx
- Configures firewall

#### Step 3: Setup Databases

This creates the PostgreSQL databases and user:

```bash
bash setup-databases.sh
```

**You'll be prompted to:**
- Enter a secure password for the database user

**Save this password!** You'll need it for the `.env` files.

#### Step 4: Configure Environment Variables

**IMPORTANT:** Before continuing, you must create the `.env` files manually. The scripts cannot do this automatically for security reasons.

```bash
cd ~/EarningsApp

# Create Gateway .env
nano backend/gateway/.env
# Copy content from deployment/gateway.env.example and update values

# Create Auth Service .env
nano backend/authservice2/.env
# Copy content from deployment/authservice.env.example and update values
# IMPORTANT: Use the database password you created in Step 3!

# Create Admin Service .env
nano backend/adminservice/.env
# Copy content from deployment/adminservice.env.example and update values
# IMPORTANT: Use the database password you created in Step 3!
```

**Quick copy method:**
```bash
# Copy example files and edit them
cp deployment/gateway.env.example backend/gateway/.env
cp deployment/authservice.env.example backend/authservice2/.env
cp deployment/adminservice.env.example backend/adminservice/.env

# Edit each file (replace placeholder values)
nano backend/gateway/.env
nano backend/authservice2/.env
nano backend/adminservice/.env
```

#### Step 5: Install Dependencies and Build

This installs all npm packages and builds all services:

```bash
cd ~/EarningsApp
bash deployment/install-and-build.sh
```

**What it does:**
- Installs root dependencies
- Installs backend dependencies (gateway, authservice, adminservice)
- Installs frontend dependencies
- Builds all services
- Runs Prisma migrations

**This may take 10-20 minutes** depending on your server speed.

#### Step 6: Seed Databases

This creates the initial admin user:

```bash
cd ~/EarningsApp
bash deployment/seed-databases.sh
```

**Default Admin Credentials:**
- Email: `sadmin@admin.com`
- Password: `Superadmin123!`
- Role: `SUPERADMIN`

#### Step 7: Create PM2 Configuration

This creates the PM2 ecosystem file:

```bash
cd ~/EarningsApp
bash deployment/create-pm2-config.sh
```

#### Step 8: Start Services

This starts all services with PM2:

```bash
cd ~/EarningsApp
bash deployment/start-services.sh
```

#### Step 9: Setup PM2 Startup (Important!)

This ensures services start automatically after server reboot:

```bash
pm2 startup
# Copy and run the command that PM2 outputs
# It will look like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your_username --hp /home/your_username
```

#### Step 10: Verify Services

```bash
# Check status
pm2 status

# Check logs
pm2 logs --lines 50

# Test endpoints
curl http://localhost:3000
curl http://localhost:3001/api
curl http://localhost:3002/api
```

### Alternative: Complete Automated Setup

If you prefer to run everything at once (after setting up databases and .env files):

```bash
cd ~/EarningsApp
bash deployment/complete-setup.sh
```

**Note:** This script will prompt you at various steps and requires:
- Databases already created
- `.env` files already configured

### Script Documentation

For detailed information about each script, see: [deployment/README.md](deployment/README.md)

---

## 📋 Manual Step-by-Step Setup

If you prefer manual setup or need more control, follow the detailed steps below.

## 🎯 Two Ways to Deploy

### Option A: Automated Setup (Recommended for First-Time Deployment)

We've created automated scripts to make deployment easier. Follow these steps:

1. **Connect to your VPS via PuTTY**
2. **Clone the repository** (if not already done)
3. **Run the automated setup scripts** in order

See the [Automated Setup Section](#-automated-setup-using-scripts) below for detailed instructions.

### Option B: Manual Step-by-Step Setup

Follow the detailed manual steps below if you prefer to understand each step or need more control.

---

## 🔧 Step 1: Server Setup

### 1.1 Connect to VPS

**Using PuTTY (Windows):**
1. Open PuTTY
2. Enter your VPS IP address in "Host Name"
3. Port: 22
4. Connection type: SSH
5. Click "Open"
6. Login with your username and password

**Using SSH (Linux/Mac):**
```bash
ssh username@your-vps-ip
```

### 1.2 Install Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required build tools
sudo apt install -y build-essential curl git

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis (recommended for admin service)
sudo apt install redis-server -y

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx (optional but recommended)
sudo apt install nginx -y

# Configure firewall (UFW)
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

### 1.3 Setup PostgreSQL

```bash
# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user and create databases
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE earnings_authdb;
CREATE DATABASE earnings_admindb;
CREATE USER earnings_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE earnings_authdb TO earnings_user;
GRANT ALL PRIVILEGES ON DATABASE earnings_admindb TO earnings_user;
ALTER USER earnings_user CREATEDB;
\q

# Test connection (replace password with your actual password)
psql -U earnings_user -d earnings_authdb -h localhost
# Enter password when prompted, then type \q to exit
```

## 📦 Step 2: Deploy Application

### 2.1 Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository (replace with your actual repository URL)
# For HTTPS:
git clone https://github.com/yourusername/your-repo-name.git EarningsApp

# OR for SSH (if you have SSH keys set up):
# git clone git@github.com:yourusername/your-repo-name.git EarningsApp

# Navigate to project directory
cd EarningsApp

# Verify you're in the correct directory
ls -la
# You should see: backend/, frontend/, deployment/, package.json, etc.
```

### 2.2 Setup Environment Variables

**IMPORTANT:** Replace all placeholder values with your actual credentials!

#### Gateway Environment (`backend/gateway/.env`)

```bash
cd ~/EarningsApp
nano backend/gateway/.env
```

Add the following content:

```env
NODE_ENV=production
PORT=3000
AUTHSERVICE_HOST=localhost
AUTHSERVICE_PORT=3001
ADMINSERVICE_HOST=localhost
ADMINSERVICE_PORT=3002
NODE_OPTIONS=--max-old-space-size=512 --max-semi-space-size=64
```

Save and exit (Ctrl+X, then Y, then Enter)

#### Auth Service Environment (`backend/authservice2/.env`)

```bash
nano backend/authservice2/.env
```

Add the following content (replace with your actual values):

```env
NODE_ENV=production
PORT=3001

# Database Configuration - REPLACE with your actual password
DATABASE_URL=postgresql://earnings_user:your_secure_password@localhost:5432/earnings_authdb?connection_limit=5&pool_timeout=20
DATABASE_POOL_SIZE=5

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration - REPLACE with a strong random string (minimum 32 characters)
JWT_SECRET=change-this-to-a-strong-random-string-minimum-32-characters-long
JWT_EXPIRATION=15m

# Google OAuth Configuration (if using Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/oauth/google/callback

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=your-email@domain.com

# Memory optimization
NODE_OPTIONS=--max-old-space-size=512 --max-semi-space-size=64
```

Save and exit (Ctrl+X, then Y, then Enter)

#### Admin Service Environment (`backend/adminservice/.env`)

```bash
nano backend/adminservice/.env
```

Add the following content (replace with your actual values):

```env
NODE_ENV=production
PORT=3002

# Database Configuration - REPLACE with your actual password
DATABASE_URL=postgresql://earnings_user:your_secure_password@localhost:5432/earnings_admindb?connection_limit=5&pool_timeout=20
DATABASE_POOL_SIZE=5

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration - REPLACE with a strong random string (minimum 32 characters)
JWT_SECRET=change-this-to-a-strong-random-string-minimum-32-characters-long
JWT_EXPIRATION=30m

# Refresh Token Configuration
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this-minimum-32-chars
REFRESH_TOKEN_EXPIRATION=7d

# Memory optimization
NODE_OPTIONS=--max-old-space-size=512 --max-semi-space-size=64
```

Save and exit (Ctrl+X, then Y, then Enter)

**Note:** For low-memory servers (1GB RAM), change `--max-old-space-size=512` to `--max-old-space-size=256`

### 2.3 Install Dependencies

```bash
# Make sure you're in the project root
cd ~/EarningsApp

# Install root dependencies (if package.json exists in root)
if [ -f "package.json" ]; then
  npm install
fi

# Install backend dependencies
echo "Installing Gateway dependencies..."
cd backend/gateway
npm install
cd ../..

echo "Installing Auth Service dependencies..."
cd backend/authservice2
npm install
cd ../..

echo "Installing Admin Service dependencies..."
cd backend/adminservice
npm install
cd ../..

# Install frontend dependencies
echo "Installing Frontend dependencies..."
cd frontend/earnings-calendar
npm install
cd ../..

echo "All dependencies installed successfully!"
```

### 2.4 Build Applications

```bash
# Make sure you're in the project root
cd ~/EarningsApp

# Build Gateway
echo "Building Gateway..."
cd backend/gateway
npm run build
cd ../..

# Build Auth Service
echo "Building Auth Service..."
cd backend/authservice2
npm run build
npx prisma generate
npx prisma migrate deploy
cd ../..

# Build Admin Service
echo "Building Admin Service..."
cd backend/adminservice
npm run build
# Note: Admin service build includes prisma generate
npx prisma migrate deploy
cd ../..

# Build Frontend
echo "Building Frontend..."
cd frontend/earnings-calendar
npm run build
cd ../..

echo "All applications built successfully!"
```

## 🚀 Step 3: Start Services with PM2

### 3.1 Create Logs Directory and PM2 Ecosystem File

```bash
# Create logs directory
cd ~/EarningsApp
mkdir -p logs

# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add the following content:

```javascript
module.exports = {
  apps: [
    {
      name: 'gateway',
      script: './dist/main.js',
      cwd: './backend/gateway',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/gateway-error.log',
      out_file: './logs/gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'authservice',
      script: './dist/src/main.js',
      cwd: './backend/authservice2',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/auth-error.log',
      out_file: './logs/auth-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'adminservice',
      script: './dist/main.js',
      cwd: './backend/adminservice',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: './logs/admin-error.log',
      out_file: './logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
```

Save and exit (Ctrl+X, then Y, then Enter)

**Note:** The authservice script path is `./dist/src/main.js` because the build output structure differs from other services.

### 3.2 Seed Databases (Important!)

Before starting services, seed the databases with initial data:

```bash
cd ~/EarningsApp

# Seed Auth Service database
echo "Seeding Auth Service database..."
cd backend/authservice2
npx prisma db seed
# OR if seed script exists:
# node prisma/seed.js
cd ../..

# Seed Admin Service database
echo "Seeding Admin Service database..."
cd backend/adminservice
npx prisma db seed
# OR if seed script exists:
# node prisma/seed.js
cd ../..
```

**Default Admin Credentials (after seeding):**
- Email: `sadmin@admin.com`
- Password: `Superadmin123!`
- Role: `SUPERADMIN`

### 3.3 Start Services

```bash
# Make sure you're in project root
cd ~/EarningsApp

# Start all services
pm2 start ecosystem.config.js

# Check status
pm2 status

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command that PM2 outputs (it will look like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your_username --hp /home/your_username)
```

### 3.4 Verify Services

```bash
# Check PM2 status (all services should show "online")
pm2 status

# Check individual service logs
pm2 logs gateway --lines 50
pm2 logs authservice --lines 50
pm2 logs adminservice --lines 50

# Test if ports are listening
sudo netstat -tulpn | grep -E '3000|3001|3002'

# Test endpoints (if health endpoints exist)
curl http://localhost:3000
curl http://localhost:3001/api
curl http://localhost:3002/api

# Check Redis connection
redis-cli ping
# Should return: PONG

# Verify PostgreSQL is running
sudo systemctl status postgresql
```

If any service shows "errored" or "stopped", check the logs:
```bash
pm2 logs <service-name> --err
```

## 🌐 Step 4: Configure Nginx (Optional)

### 4.1 Create Nginx Configuration

```bash
# Create Nginx configuration file
sudo nano /etc/nginx/sites-available/earnings-app
```

Add the following content (replace `your-domain.com` with your actual domain and `username` with your VPS username):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Increase client body size for file uploads
    client_max_body_size 500M;

    # Frontend
    location / {
        root /home/username/EarningsApp/frontend/earnings-calendar/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # API Gateway
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for large file uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # WebSocket support (if needed for chat)
    location /socket.io/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Save and exit (Ctrl+X, then Y, then Enter)

**Important:** Replace:
- `your-domain.com` with your actual domain name
- `username` with your VPS username (check with `whoami` command)

### 4.2 Enable Site

```bash
# Remove default Nginx site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Enable your site
sudo ln -s /etc/nginx/sites-available/earnings-app /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test is successful, restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

## 🔒 Step 5: Setup SSL (Let's Encrypt)

**Note:** SSL setup requires a domain name pointing to your VPS IP address.

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)

# Test auto-renewal
sudo certbot renew --dry-run

# Auto-renewal is set up automatically via cron
# Verify renewal is scheduled:
sudo systemctl status certbot.timer
```

After SSL setup, your site will be accessible at `https://your-domain.com`

## 📊 Step 6: Monitoring & Maintenance

### 6.1 PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all
pm2 restart gateway

# Stop services
pm2 stop all

# Delete services
pm2 delete all
```

### 6.2 Update Application

```bash
# Navigate to project directory
cd ~/EarningsApp

# Pull latest changes
git pull

# Rebuild and restart services
echo "Updating Gateway..."
cd backend/gateway
npm install
npm run build
cd ../..

echo "Updating Auth Service..."
cd backend/authservice2
npm install
npm run build
npx prisma generate
npx prisma migrate deploy
cd ../..

echo "Updating Admin Service..."
cd backend/adminservice
npm install
npm run build
npx prisma migrate deploy
cd ../..

echo "Updating Frontend..."
cd frontend/earnings-calendar
npm install
npm run build
cd ../..

# Restart all PM2 services
pm2 restart all

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

### 6.3 Quick Reference Commands

```bash
# View all services status
pm2 status

# View logs (all services)
pm2 logs

# View logs (specific service, last 100 lines)
pm2 logs gateway --lines 100

# Restart all services
pm2 restart all

# Restart specific service
pm2 restart gateway

# Stop all services
pm2 stop all

# Start all services
pm2 start all

# Delete all services
pm2 delete all

# Monitor services (real-time)
pm2 monit

# Check service info
pm2 info gateway

# Reload services (zero-downtime)
pm2 reload all
```

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check PM2 logs
pm2 logs

# Check specific service logs
pm2 logs gateway --err
pm2 logs authservice --err
pm2 logs adminservice --err

# Check if ports are in use
sudo netstat -tulpn | grep -E '3000|3001|3002'
# OR use:
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :3002

# Check environment variables
pm2 env gateway
pm2 env authservice
pm2 env adminservice

# Restart a specific service
pm2 restart gateway

# Delete and restart a service
pm2 delete gateway
pm2 start ecosystem.config.js --only gateway

# Check if .env files exist and are readable
ls -la backend/gateway/.env
ls -la backend/authservice2/.env
ls -la backend/adminservice/.env
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test PostgreSQL connection
psql -U earnings_user -d earnings_authdb -h localhost
# Enter password when prompted

# Check if databases exist
sudo -u postgres psql -c "\l" | grep earnings

# Check database user permissions
sudo -u postgres psql -c "\du earnings_user"

# Test connection from application directory
cd ~/EarningsApp/backend/authservice2
npx prisma db pull

# Check Prisma connection
npx prisma db execute --stdin <<< "SELECT 1;"
```

### Redis Connection Issues

```bash
# Check Redis status
sudo systemctl status redis-server

# Test Redis connection
redis-cli ping
# Should return: PONG

# Check Redis is listening
sudo netstat -tulpn | grep 6379

# Restart Redis if needed
sudo systemctl restart redis-server
```

### Memory Issues

If you encounter memory issues, adjust `NODE_OPTIONS` in environment files:
```env
NODE_OPTIONS=--max-old-space-size=256
```

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] VPS server accessible via SSH/PuTTY
- [ ] Domain name pointing to VPS IP (optional but recommended)
- [ ] Git repository access configured

### Server Setup
- [ ] System packages updated (`sudo apt update && sudo apt upgrade`)
- [ ] Node.js 18+ installed and verified
- [ ] PostgreSQL installed and running
- [ ] Redis installed and running (optional but recommended)
- [ ] PM2 installed globally
- [ ] Nginx installed (if using reverse proxy)
- [ ] Firewall configured (ports 22, 80, 443 open)

### Database Setup
- [ ] PostgreSQL service running
- [ ] Databases created (`earnings_authdb`, `earnings_admindb`)
- [ ] Database user created (`earnings_user`)
- [ ] Permissions granted to database user
- [ ] Database connection tested

### Application Deployment
- [ ] Repository cloned to VPS
- [ ] Environment variables configured (`.env` files created)
- [ ] All dependencies installed (root, backend, frontend)
- [ ] All applications built successfully
- [ ] Prisma migrations deployed
- [ ] Databases seeded with initial data

### Service Management
- [ ] Logs directory created
- [ ] PM2 ecosystem file created
- [ ] All PM2 services started and running
- [ ] PM2 services saved (`pm2 save`)
- [ ] PM2 startup configured (`pm2 startup`)

### Verification
- [ ] All services show "online" in `pm2 status`
- [ ] Ports 3000, 3001, 3002 are listening
- [ ] Services respond to curl requests
- [ ] Frontend build exists in `frontend/earnings-calendar/dist`

### Nginx & SSL (Optional)
- [ ] Nginx configuration created
- [ ] Nginx site enabled
- [ ] Nginx configuration tested (`sudo nginx -t`)
- [ ] Nginx service running
- [ ] SSL certificate installed (if using domain)
- [ ] HTTPS redirect working (if using SSL)

### Final Checks
- [ ] Application accessible via domain/IP
- [ ] API endpoints responding
- [ ] Frontend loads correctly
- [ ] Can login with admin credentials
- [ ] All services restart after server reboot

## 📝 Important Notes

### Security
- **Never commit `.env` files to git** - they contain sensitive credentials
- Use strong passwords for database users (minimum 16 characters)
- Generate strong JWT secrets (minimum 32 characters, use random strings)
- Keep your VPS and packages updated regularly
- Use SSH keys instead of passwords for SSH access (recommended)

### Performance
- Adjust `NODE_OPTIONS` based on your server RAM:
  - 1GB RAM: `--max-old-space-size=256`
  - 2GB RAM: `--max-old-space-size=512`
  - 4GB+ RAM: `--max-old-space-size=1024`
- Monitor memory usage: `pm2 monit`
- Monitor logs regularly: `pm2 logs`

### Maintenance
- Regularly update dependencies: `npm audit fix`
- Setup automated backups for PostgreSQL databases
- Monitor PM2 logs for errors: `pm2 logs --err`
- Check service health regularly: `pm2 status`
- Keep Node.js and system packages updated

### Troubleshooting Tips
- If services fail to start, check logs first: `pm2 logs <service-name> --err`
- Verify environment variables are loaded: `pm2 env <service-name>`
- Check if ports are available: `sudo lsof -i :PORT`
- Verify database connections: `psql -U earnings_user -d earnings_authdb`
- Check Redis connection: `redis-cli ping`

### Backup Recommendations
```bash
# Backup PostgreSQL databases
pg_dump -U earnings_user earnings_authdb > backup_authdb_$(date +%Y%m%d).sql
pg_dump -U earnings_user earnings_admindb > backup_admindb_$(date +%Y%m%d).sql

# Backup environment files
tar -czf env_backup_$(date +%Y%m%d).tar.gz backend/*/.env
```

### Alternative Process Manager
If PM2 doesn't work for your setup, consider using systemd. However, PM2 is recommended for Node.js applications.

---

## 📚 Quick Reference Commands

### Essential Commands

```bash
# Check service status
pm2 status

# View all logs
pm2 logs

# View specific service logs
pm2 logs gateway --lines 100

# Restart all services
pm2 restart all

# Restart specific service
pm2 restart gateway

# Stop all services
pm2 stop all

# Start all services
pm2 start all

# Delete all services (to start fresh)
pm2 delete all
```

### Database Commands

```bash
# Connect to database
psql -U earnings_user -d earnings_authdb -h localhost

# List all databases
sudo -u postgres psql -c "\l"

# Check database user
sudo -u postgres psql -c "\du earnings_user"

# Backup database
pg_dump -U earnings_user earnings_authdb > backup.sql

# Restore database
psql -U earnings_user -d earnings_authdb < backup.sql
```

### Service Management

```bash
# Check if ports are in use
sudo netstat -tulpn | grep -E '3000|3001|3002'

# Check service logs (errors only)
pm2 logs --err

# Monitor services (real-time)
pm2 monit

# Check service info
pm2 info gateway

# Reload services (zero-downtime)
pm2 reload all

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### System Services

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check Redis status
sudo systemctl status redis-server

# Test Redis connection
redis-cli ping

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# Test Nginx configuration
sudo nginx -t
```

### Application Updates

```bash
# Pull latest code
cd ~/EarningsApp
git pull

# Rebuild and restart (Gateway)
cd backend/gateway
npm install && npm run build
cd ../..
pm2 restart gateway

# Rebuild and restart (Auth Service)
cd backend/authservice2
npm install && npm run build
npx prisma migrate deploy
cd ../..
pm2 restart authservice

# Rebuild and restart (Admin Service)
cd backend/adminservice
npm install && npm run build
npx prisma migrate deploy
cd ../..
pm2 restart adminservice

# Rebuild and restart (Frontend)
cd frontend/earnings-calendar
npm install && npm run build
cd ../..
# Restart Nginx if serving frontend
sudo systemctl restart nginx
```

### Troubleshooting Commands

```bash
# Check PM2 logs for errors
pm2 logs --err

# Check environment variables
pm2 env gateway

# Check if process is running
ps aux | grep node

# Check disk space
df -h

# Check memory usage
free -h

# Check system resources
htop  # or: top
```

---

## 🎓 Learning Resources

- **PM2 Documentation:** https://pm2.keymetrics.io/docs/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Node.js Best Practices:** https://github.com/goldbergyoni/nodebestpractices

---

## 📞 Need Help?

If you encounter issues:

1. **Check the logs first:**
   ```bash
   pm2 logs --err
   ```

2. **Verify environment variables:**
   ```bash
   pm2 env <service-name>
   ```

3. **Test database connection:**
   ```bash
   psql -U earnings_user -d earnings_authdb -h localhost
   ```

4. **Check service status:**
   ```bash
   pm2 status
   sudo systemctl status postgresql
   sudo systemctl status redis-server
   ```

5. **Review the troubleshooting section** in this guide for common issues.


