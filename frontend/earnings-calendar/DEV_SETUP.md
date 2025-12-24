# 🚀 Local Development Setup (Fast HMR - No Docker Rebuilds!)

## Quick Start for Frontend Development

**You DON'T need Docker for frontend development!** Run the frontend directly for instant hot-reload.

### Step 1: Start Backend Services Only (Docker)

```bash
# From project root
docker-compose up -d postgres redis gateway auth-service adminservice
```

This starts only the backend services. The frontend will run separately.

### Step 2: Start Frontend Dev Server (Direct - No Docker)

```bash
# Navigate to frontend directory
cd frontend/earnings-calendar

# Install dependencies (if not already done)
npm install

# Start dev server with hot-reload
npm run dev
```

The frontend will be available at: **http://localhost:5173**

### Benefits:
- ✅ **Instant updates** - Changes reflect immediately (no rebuild needed)
- ✅ **Fast HMR** - Only changed components reload
- ✅ **Better debugging** - Full source maps
- ✅ **No waiting** - No Docker build times

## When to Use Docker for Frontend

Only use Docker frontend for:
- Testing production builds
- Deployment
- CI/CD pipelines

## Troubleshooting

### If changes don't reflect:
1. **Hard refresh browser**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear browser cache**: DevTools → Application → Clear Storage
3. **Restart dev server**: `Ctrl+C` then `npm run dev` again
4. **Check console**: Look for errors in browser DevTools (F12)

### If backend APIs aren't working:
- Make sure backend services are running: `docker-compose ps`
- Check API endpoints are accessible: `curl http://localhost:3000/health`

## Development Workflow

```bash
# Terminal 1: Backend services (Docker)
docker-compose up -d postgres redis gateway auth-service adminservice

# Terminal 2: Frontend dev server (Direct)
cd frontend/earnings-calendar
npm run dev

# Make changes to code → See updates instantly! 🎉
```

## Production Build (When Needed)

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

