# Chat Module Setup & Migration Guide

## ✅ Migration Completed

The Prisma migration has been successfully applied:
- **Migration Name**: `20251207005124_chat`
- **Database**: `admindb` at `localhost:5434`
- **Status**: ✅ Database schema is now in sync

## 📋 New Database Models

The following models have been added to the database:

1. **Topic** - Discussion topics created by SUPER_ADMIN
2. **Chat** - Chat rooms (GROUP or ONE_TO_ONE)
3. **Message** - Chat messages
4. **ChatMember** - Chat participants
5. **UserBlock** - User blocking relationships
6. **ChatType** - Enum (GROUP, ONE_TO_ONE)

## 🚀 Starting the Service

### Option 1: Docker Compose (Recommended)
```bash
cd backend
docker compose up -d adminservice
```

### Option 2: Local Development
```bash
cd backend/adminservice
# Set DATABASE_URL environment variable
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5434/admindb"
npm run start:dev
```

## 🔌 Socket.io Configuration

The WebSocket server is configured to run on the same HTTP server:
- **HTTP Port**: 3002
- **WebSocket Namespace**: `/chat`
- **WebSocket URL**: `ws://localhost:3002/chat`

### Frontend Connection
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3002/chat', {
  auth: {
    token: 'your-jwt-token' // From cookies or auth state
  },
  transports: ['websocket', 'polling']
});
```

## 📡 API Endpoints

All endpoints require authentication (JWT token in cookies):

### Topics
- `POST /api/chat/topics` - Create topic (SUPER_ADMIN only)
- `GET /api/chat/topics` - Get all active topics
- `GET /api/chat/topics/:id` - Get topic by ID

### Messages
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages?topicId=:id&page=1&limit=50` - Get messages

### User Blocking
- `POST /api/chat/block` - Block a user
- `DELETE /api/chat/block/:blockedId` - Unblock a user
- `GET /api/chat/blocked` - Get blocked users list

### Chats
- `POST /api/chat/chats/one-to-one/:userId` - Create one-to-one chat
- `GET /api/chat/chats` - Get user's chats

### Admin Functions
- `PUT /api/chat/users/:userId/suspend` - Suspend user (ADMIN/SUPER_ADMIN)
- `PUT /api/chat/users/:userId/unsuspend` - Unsuspend user (ADMIN/SUPER_ADMIN)

## 🔐 Authentication

All endpoints use JWT authentication via cookies. The WebSocket connection also requires JWT token in the handshake:
- `auth.token` or `query.token` in Socket.io handshake

## 📝 Next Steps

1. ✅ Database migration completed
2. ✅ Prisma client generated
3. ✅ Dependencies installed (Socket.io, axios, jsonwebtoken)
4. ⏳ Start the service and test endpoints
5. ⏳ Implement frontend components (Topics page, Chat interface)

## 🐛 Troubleshooting

### Migration Issues
If you encounter migration errors:
```bash
# Reset and re-run migration (WARNING: Deletes all data)
npm run migrate -- --force

# Or create a new migration
npm run migrate
```

### Build Errors
If build fails:
```bash
# Regenerate Prisma client
npm run generate

# Reinstall dependencies
npm install --legacy-peer-deps
```

### Socket.io Connection Issues
- Ensure CORS is properly configured
- Check that JWT token is being sent in handshake
- Verify WebSocket namespace matches (`/chat`)

## 📚 Files Created

### Backend
- `src/chat/chat.service.ts` - Business logic
- `src/chat/chat.controller.ts` - REST API endpoints
- `src/chat/chat.gateway.ts` - WebSocket gateway
- `src/chat/chat.module.ts` - Module definition
- `src/chat/dto/*.ts` - Data transfer objects

### Database
- `prisma/migrations/20251207005124_chat/migration.sql` - Migration file

