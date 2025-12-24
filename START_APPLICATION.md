# 🚀 Complete Application Startup Guide

## Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ (for local frontend development)
- PostgreSQL running on port 5434 (or use Docker)
- Redis running on port 6379 (or use Docker)

## 📋 Quick Start (Recommended - Docker)

### Step 1: Start Backend Services

```bash
# Navigate to backend directory
cd backend

# Start all services (PostgreSQL, Redis, Auth Service, Admin Service, Gateway)
docker compose up -d

# Wait for services to be healthy (about 30 seconds)
docker compose ps
```

### Step 2: Run Database Migrations

```bash
# Run Prisma migrations for Admin Service (includes chat module)
docker compose exec adminservice npm run migrate

# Or if running locally:
cd adminservice
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5434/admindb"
npm run migrate
```

### Step 3: Seed Super Admin User (if not already done)

```bash
# Seed Auth Service
docker compose exec auth-service node prisma/seed.js

# Seed Admin Service
docker compose exec adminservice node prisma/seed.js
```

### Step 4: Start Frontend (Local Development)

```bash
# Navigate to frontend
cd frontend/earnings-calendar

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

### Step 5: Verify Services

- **Frontend**: http://localhost:5173
- **Gateway**: http://localhost:3000
- **Auth Service**: http://localhost:3001
- **Admin Service**: http://localhost:3002
- **PostgreSQL**: localhost:5434
- **Redis**: localhost:6379

---

## 🔧 Alternative: Local Development (No Docker)

### Backend Services

#### 1. Start PostgreSQL & Redis
```bash
# Using Docker (recommended)
cd backend
docker compose up -d postgres redis

# Or use local PostgreSQL and Redis
```

#### 2. Start Auth Service
```bash
cd backend/authservice2
npm install
npm run start:dev
# Runs on http://localhost:3001
```

#### 3. Start Admin Service
```bash
cd backend/adminservice
npm install

# Set environment variables
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5434/admindb"
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6379"
$env:JWT_SECRET = "your-jwt-secret-key-change-this-in-production"

# Run migrations
npm run migrate

# Start service
npm run start:dev
# Runs on http://localhost:3002
```

#### 4. Start Gateway
```bash
cd backend/gateway
npm install
npm run start:dev
# Runs on http://localhost:3000
```

#### 5. Start Frontend
```bash
cd frontend/earnings-calendar
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## 🐳 Docker Commands Reference

### Start Services
```bash
cd backend
docker compose up -d                    # Start all services in background
docker compose up                       # Start with logs visible
```

### Stop Services
```bash
docker compose down                     # Stop all services
docker compose down -v                  # Stop and remove volumes
```

### View Logs
```bash
docker compose logs                     # All services
docker compose logs adminservice        # Specific service
docker compose logs -f adminservice      # Follow logs
```

### Restart Service
```bash
docker compose restart adminservice     # Restart specific service
docker compose restart                  # Restart all services
```

### Rebuild After Code Changes
```bash
docker compose build adminservice       # Rebuild specific service
docker compose build                    # Rebuild all services
docker compose up -d --build            # Rebuild and start
```

### Execute Commands in Container
```bash
docker compose exec adminservice sh     # Open shell in container
docker compose exec adminservice npm run migrate  # Run migration
```

---

## ✅ Health Checks

### Check Service Status
```bash
# Docker services
docker compose ps

# Test Gateway
curl http://localhost:3000/health

# Test Auth Service
curl http://localhost:3001/health

# Test Admin Service
curl http://localhost:3002/api/stock/test
```

### Check Database Connection
```bash
# PostgreSQL
docker compose exec postgres psql -U postgres -d admindb -c "SELECT 1;"

# Redis
docker compose exec redis redis-cli ping
```

---

## 🔐 Default Login Credentials

After seeding:
- **Email**: `sadmin@admin.com`
- **Password**: `Superadmin123!`
- **Role**: `SUPERADMIN`

---

## 📡 API Endpoints

All requests go through Gateway: `http://localhost:3000/api/`

### Chat Endpoints
- `GET /api/chat/topics` - List all topics (public)
- `POST /api/chat/topics` - Create topic (Admin/SuperAdmin)
- `GET /api/chat/topics/:id` - Get topic details (public)
- `POST /api/chat/messages` - Send message (authenticated)
- `GET /api/chat/messages` - Get messages (authenticated)
- `GET /api/chat/chats` - Get user chats (authenticated)
- `POST /api/chat/chats/one-to-one/:userId` - Create one-to-one chat
- `POST /api/chat/block` - Block user
- `DELETE /api/chat/block/:blockedId` - Unblock user
- `PUT /api/chat/users/:userId/suspend` - Suspend user (Admin)
- `PUT /api/chat/users/:userId/unsuspend` - Unsuspend user (Admin)

### WebSocket
- **URL**: `ws://localhost:3002/chat`
- **Namespace**: `/chat`
- **Auth**: JWT token in handshake

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :3002
netstat -ano | findstr :5173

# Kill process (Windows)
taskkill /PID <PID> /F
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check database exists
docker compose exec postgres psql -U postgres -l

# Recreate database
docker compose down -v
docker compose up -d postgres
# Then run migrations again
```

### Migration Errors
```bash
# Reset database (WARNING: Deletes all data)
cd backend/adminservice
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5434/admindb"
npm run migrate -- --force

# Or recreate migration
npm run migrate
```

### Service Won't Start
```bash
# Check logs
docker compose logs adminservice

# Rebuild service
docker compose build --no-cache adminservice
docker compose up -d adminservice
```

### Frontend API Errors
- Ensure Gateway is running on port 3000
- Check CORS settings in backend services
- Verify cookies are being sent (check browser DevTools)
- Check API base URL in `vite.config.ts`

---

## 📝 Environment Variables

### Admin Service
```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/admindb
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your-jwt-secret-key-change-this-in-production
JWT_EXPIRATION=30m
REFRESH_TOKEN_SECRET=your_refresh_secret_key
REFRESH_TOKEN_EXPIRATION=7d
PORT=3002
```

### Gateway
```env
PORT=3000
AUTHSERVICE_HOST=auth-service
AUTHSERVICE_PORT=3001
ADMINSERVICE_HOST=adminservice
ADMINSERVICE_PORT=3002
```

---

## 🎯 Quick Verification Checklist

- [ ] PostgreSQL is running and accessible
- [ ] Redis is running and accessible
- [ ] Auth Service is running on port 3001
- [ ] Admin Service is running on port 3002
- [ ] Gateway is running on port 3000
- [ ] Database migrations are applied
- [ ] Super admin user is seeded
- [ ] Frontend is running on port 5173
- [ ] Can access http://localhost:5173
- [ ] Can login with super admin credentials
- [ ] Can access chat endpoints

---

## 🚀 Production Deployment

For production, ensure:
1. Change all default passwords and secrets
2. Use environment variables for sensitive data
3. Enable HTTPS
4. Configure proper CORS origins
5. Set up proper logging and monitoring
6. Use production database (not local)
7. Configure Redis persistence if needed

