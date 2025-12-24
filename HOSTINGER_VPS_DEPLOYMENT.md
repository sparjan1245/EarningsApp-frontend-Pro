# 🚀 Hostinger VPS Deployment Guide

Complete guide for deploying the Earnings App to Hostinger VPS.

## 📋 Prerequisites

- Hostinger VPS with SSH access
- Node.js 18+ installed
- PostgreSQL database
- PM2 or systemd for process management
- Nginx for reverse proxy (optional but recommended)

## 🏗️ Project Structure

```
EarningsApp-frontend-dev/
├── backend/
│   ├── gateway/          # API Gateway (Port 3000)
│   ├── authservice2/     # Authentication Service (Port 3001)
│   └── adminservice/     # Admin Service (Port 3002)
├── frontend/
│   └── earnings-calendar/ # React Frontend
└── deployment/           # Environment configuration files
```

## 🔧 Step 1: Server Setup

### 1.1 Connect to VPS

```bash
ssh username@your-vps-ip
```

### 1.2 Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx (optional)
sudo apt install nginx -y
```

### 1.3 Setup PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create databases
CREATE DATABASE earnings_auth;
CREATE DATABASE earnings_admin;
CREATE USER earnings_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE earnings_auth TO earnings_user;
GRANT ALL PRIVILEGES ON DATABASE earnings_admin TO earnings_user;
\q
```

## 📦 Step 2: Deploy Application

### 2.1 Clone Repository

```bash
cd ~
git clone <your-repo-url> EarningsApp
cd EarningsApp
```

### 2.2 Setup Environment Variables

#### Gateway Environment (`backend/gateway/.env`)

```env
NODE_ENV=production
PORT=3000
AUTHSERVICE_HOST=localhost
AUTHSERVICE_PORT=3001
ADMINSERVICE_HOST=localhost
ADMINSERVICE_PORT=3002
NODE_OPTIONS=--max-old-space-size=512
```

#### Auth Service Environment (`backend/authservice2/.env`)

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://earnings_user:your_secure_password@localhost:5432/earnings_auth
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
RESEND_API_KEY=your_resend_api_key
NODE_OPTIONS=--max-old-space-size=512
```

#### Admin Service Environment (`backend/adminservice/.env`)

```env
NODE_ENV=production
PORT=3002
DATABASE_URL=postgresql://earnings_user:your_secure_password@localhost:5432/earnings_admin
JWT_SECRET=your_jwt_secret_min_32_chars
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_OPTIONS=--max-old-space-size=512
```

### 2.3 Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend/gateway && npm install && cd ../..
cd backend/authservice2 && npm install && cd ../..
cd backend/adminservice && npm install && cd ../..

# Install frontend dependencies
cd frontend/earnings-calendar && npm install && cd ../..
```

### 2.4 Build Applications

```bash
# Build Gateway
cd backend/gateway
npm run build
cd ../..

# Build Auth Service
cd backend/authservice2
npm run build
npx prisma generate
npx prisma migrate deploy
cd ../..

# Build Admin Service
cd backend/adminservice
npm run build
npx prisma generate
npx prisma migrate deploy
cd ../..

# Build Frontend
cd frontend/earnings-calendar
npm run build
cd ../..
```

## 🚀 Step 3: Start Services with PM2

### 3.1 Create PM2 Ecosystem File

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'gateway',
      script: './backend/gateway/dist/main.js',
      cwd: './backend/gateway',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/gateway-error.log',
      out_file: './logs/gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'authservice',
      script: './backend/authservice2/dist/main.js',
      cwd: './backend/authservice2',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/auth-error.log',
      out_file: './logs/auth-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'adminservice',
      script: './backend/adminservice/dist/main.js',
      cwd: './backend/adminservice',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: './logs/admin-error.log',
      out_file: './logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

### 3.2 Start Services

```bash
# Start all services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided
```

### 3.3 Verify Services

```bash
# Check status
pm2 status

# Check logs
pm2 logs gateway
pm2 logs authservice
pm2 logs adminservice

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

## 🌐 Step 4: Configure Nginx (Optional)

### 4.1 Create Nginx Configuration

Create `/etc/nginx/sites-available/earnings-app`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /home/username/EarningsApp/frontend/earnings-calendar/dist;
        try_files $uri $uri/ /index.html;
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
    }
}
```

### 4.2 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/earnings-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Step 5: Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

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
cd ~/EarningsApp
git pull

# Rebuild and restart
cd backend/gateway && npm install && npm run build && cd ../..
cd backend/authservice2 && npm install && npm run build && npx prisma migrate deploy && cd ../..
cd backend/adminservice && npm install && npm run build && npx prisma migrate deploy && cd ../..
cd frontend/earnings-calendar && npm install && npm run build && cd ../..

pm2 restart all
```

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check logs
pm2 logs

# Check if ports are in use
sudo netstat -tulpn | grep -E '3000|3001|3002'

# Check environment variables
pm2 env <app-name>
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U earnings_user -d earnings_auth -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Memory Issues

If you encounter memory issues, adjust `NODE_OPTIONS` in environment files:
```env
NODE_OPTIONS=--max-old-space-size=256
```

## ✅ Deployment Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and databases created
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Applications built
- [ ] PM2 services started
- [ ] Services responding to health checks
- [ ] Nginx configured (if using)
- [ ] SSL certificate installed
- [ ] Firewall configured (ports 80, 443 open)
- [ ] PM2 startup configured

## 📝 Notes

- Keep `.env` files secure and never commit them to git
- Regularly update dependencies: `npm audit fix`
- Monitor PM2 logs for errors
- Setup automated backups for PostgreSQL databases
- Consider using a process manager like systemd if PM2 doesn't work for your setup

