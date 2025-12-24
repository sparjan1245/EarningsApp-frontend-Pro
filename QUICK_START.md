# ⚡ Quick Start Guide

## One-Command Startup (PowerShell)

```powershell
# 1. Start all backend services
cd backend
docker compose up -d

# 2. Wait 10 seconds for services to start
Start-Sleep -Seconds 10

# 3. Run migrations
docker compose exec adminservice npm run migrate

# 4. Start frontend (in new terminal)
cd ..\frontend\earnings-calendar
npm run dev
```

## Verify Everything Works

1. **Check services**: http://localhost:3000/health
2. **Open app**: http://localhost:5173
3. **Login**: 
   - Email: `sadmin@admin.com`
   - Password: `Superadmin123!`
4. **Test chat**: Click chat icon → Create topic

## Common Issues

**404 on API calls?**
- Check Gateway is running: `docker compose ps gateway`
- Check logs: `docker compose logs gateway`

**Can't create topic?**
- Verify you're logged in as Admin/SuperAdmin
- Check browser console for errors
- Verify backend logs: `docker compose logs adminservice`

**Database errors?**
- Run migrations: `docker compose exec adminservice npm run migrate`
- Check PostgreSQL: `docker compose ps postgres`

