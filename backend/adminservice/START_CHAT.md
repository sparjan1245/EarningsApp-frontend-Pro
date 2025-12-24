# Starting Chat Module with Docker

## Quick Start

1. **Ensure database migration is complete:**
   ```bash
   cd backend/adminservice
   $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5434/admindb"
   npm run migrate
   ```

2. **Start all services with Docker Compose:**
   ```bash
   cd backend
   docker compose up -d
   ```

3. **Verify services are running:**
   ```bash
   docker compose ps
   ```

## Service Endpoints

- **Admin Service HTTP**: `http://localhost:3002/api/chat/*`
- **WebSocket**: `ws://localhost:3002/chat`
- **Gateway**: Routes through `http://localhost:3000/api/chat/*`

## Frontend Access

- **Topics Page**: `http://localhost:5173/chat/topics`
- **Channel Chat**: `http://localhost:5173/chat/topic/:topicId`
- **One-to-One Chat**: `http://localhost:5173/chat/one-to-one/:chatId`
- **My Chats**: `http://localhost:5173/chat/chats`
- **Admin Chat Management**: `http://localhost:5173/admin/chat`

## Features Implemented

✅ **Backend:**
- Topic creation (SUPER_ADMIN only)
- Public topic viewing
- Real-time messaging via Socket.io
- User blocking
- User suspension (Admin)
- Redis integration for online users
- One-to-one chat creation

✅ **Frontend:**
- Topics page (public view)
- Channel chat interface
- One-to-one chat interface
- Chat list page
- Admin chat management
- User blocking UI
- Real-time message updates
- Typing indicators

## Testing

1. **Create a topic** (as SUPER_ADMIN):
   - Go to `/admin/chat` or `/chat/topics`
   - Click "Create Topic"

2. **Join a discussion** (as any user):
   - Go to `/chat/topics`
   - Click "Join Discussion" on any topic
   - Start chatting!

3. **Create one-to-one chat**:
   - Use API: `POST /api/chat/chats/one-to-one/:userId`
   - Or implement UI button

4. **Block a user**:
   - In chat, hover over a message
   - Click the three dots menu
   - Click "Block User"

