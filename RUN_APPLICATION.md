# 🚀 Run Application - Step by Step

## Quick Start (Recommended)

### 1. Start Backend Services

```powershell
# Navigate to backend directory
cd backend

# Start all services
docker compose up -d

# Wait for services to start (30 seconds)
Start-Sleep -Seconds 30
```

### 2. Run Database Migrations

```powershell
# Run migrations for Admin Service (includes chat tables)
docker compose exec adminservice npm run migrate
```

### 3. Start Frontend

```powershell
# Navigate to frontend
cd ..\frontend\earnings-calendar

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

### 4. Access Application

- **Frontend**: http://localhost:5173
- **Gateway API**: http://localhost:3000
- **Login**: 
  - Email: `sadmin@admin.com`
  - Password: `Superadmin123!`

---

## Verify Services

```powershell
# Check all services are running
docker compose ps

# Check logs
docker compose logs gateway
docker compose logs adminservice
docker compose logs auth-service
```

---

## Troubleshooting

### If package-lock.json is out of sync:

```powershell
cd backend\adminservice
npm install
cd ..\..
```

### If migrations fail:

```powershell
# Check database connection
docker compose exec postgres psql -U postgres -d admindb -c "SELECT 1;"

# Run migrations manually
docker compose exec adminservice npm run migrate
```

### If services won't start:

```powershell
# Rebuild services
cd backend
docker compose build --no-cache
docker compose up -d
```

---

## All Services Status

After starting, you should see:
- ✅ postgres (port 5434)
- ✅ redis (port 6379)
- ✅ auth-service (port 3001)
- ✅ adminservice (port 3002)
- ✅ gateway (port 3000)
- ✅ Frontend (port 5173)

---

## Test Chat API

Once everything is running:

1. Login as admin at http://localhost:5173
2. Navigate to Chat Management or Topics page
3. Create a new topic
4. Start chatting!

