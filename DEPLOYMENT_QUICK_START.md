# ⚡ Quick Start Deployment - sdnsoftech.info

## 🚀 One-Command Deployment

```bash
# SSH into your server
ssh root@YOUR_VPS_IP

# Clone and deploy
git clone https://github.com/sparjan1245/EarningsApp-frontend-Pro.git /var/www/earnings-app
cd /var/www/earnings-app
chmod +x deploy-production.sh
./deploy-production.sh
```

**That's it!** The script handles everything automatically.

---

## ⚙️ Before Running: Setup Environment Variables

**IMPORTANT:** Create `.env.production` file before running deployment:

```bash
cd /var/www/earnings-app
cp env.production.example .env.production
nano .env.production
```

**Update these required values:**
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - Generate: `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `RESEND_API_KEY` - From Resend dashboard

---

## ✅ Post-Deployment Verification

```bash
# Check all services are running
pm2 status

# Test health endpoint
curl http://localhost:3000/health

# View logs
pm2 logs

# Check nginx
systemctl status nginx

# Test SSL
curl https://sdnsoftech.info/health
```

---

## 🔧 Common Commands

```bash
# Restart services
pm2 restart all

# View logs
pm2 logs gateway
pm2 logs auth-service
pm2 logs adminservice

# Update application
cd /var/www/earnings-app
git pull origin main
cd backend/gateway && npm run build && cd ../..
cd backend/authservice2 && npm run build && cd ../..
cd backend/adminservice && npm run build && cd ../..
pm2 restart all
```

---

## 📚 Full Documentation

See `PRODUCTION_DEPLOYMENT.md` for complete manual deployment instructions.

---

**🎉 Your application will be live at https://sdnsoftech.info after deployment!**
