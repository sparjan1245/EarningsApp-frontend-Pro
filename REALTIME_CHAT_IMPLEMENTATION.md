# Real-Time Chat Implementation Guide

## ✅ Complete Production-Ready Solution

This document provides a comprehensive guide to the real-time chat system implemented in your application using **WebSockets (Socket.IO)**.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Features Implemented](#features-implemented)
3. [Socket Events](#socket-events)
4. [Frontend Implementation](#frontend-implementation)
5. [Backend Implementation](#backend-implementation)
6. [Message Flow](#message-flow)
7. [File Structure](#file-structure)
8. [Integration Guide](#integration-guide)
9. [Example Payloads](#example-payloads)

---

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: React + TypeScript + Material-UI
- **Backend**: NestJS + Socket.IO
- **Database**: PostgreSQL (Prisma ORM)
- **Cache**: Redis (for online status)
- **Authentication**: JWT tokens

### Real-Time Communication Flow

```
User Action → Frontend → HTTP API → Backend Service → Database
                                    ↓
                              Socket.IO Broadcast
                                    ↓
                        All Connected Clients (Real-time)
```

---

## ✨ Features Implemented

### ✅ Real-Time Messaging
- **Instant message delivery** via WebSocket
- **No page refresh** required
- **No polling** - pure WebSocket push
- **Message deduplication** to prevent duplicates

### ✅ Chat Types
1. **Group Chat (Channels)**
   - Multiple users in a topic/channel
   - Real-time group messaging
   - Member management

2. **One-to-One Chat**
   - Private conversations
   - Direct messaging between two users

### ✅ User & Group Features
- ✅ **Search users** by name/email
- ✅ **Search channels** by title/description
- ✅ **Start individual chat** from user list
- ✅ **Join/leave group channels** (auto-join on first message)
- ✅ **User blocking** functionality

### ✅ Chat UI Components

#### Left Sidebar
- **Channels List**: All available group channels with search
- **Chats List**: All individual chats with search
- **Responsive**: Drawer on mobile, fixed sidebar on desktop

#### Top Bar
- **Chat name** (group or user)
- **Connection status** indicator
- **Member count** (for groups)
- **Online status** (for one-to-one)

#### Message Area
- ✅ **Sender & receiver messages** with left/right alignment
- ✅ **Timestamps** (formatted: "Today", "Yesterday", or date)
- ✅ **Message status icons** (sent ✓, delivered ✓✓, read ✓✓ blue)
- ✅ **User avatars** with grouping logic
- ✅ **Date separators**
- ✅ **Message grouping** (messages within 5 minutes from same user)

### ✅ Live Indicators
- ✅ **Online/offline status** (connection indicator)
- ✅ **Typing indicator** (shows when users are typing)
- ✅ **Connection status** (Active/Connecting)

---

## 🔌 Socket Events

### Client → Server Events

#### `join-topic`
Join a group channel/topic room.

```typescript
socket.emit('join-topic', { topicId: string });
```

**Response:**
```typescript
{ success: true, topicId: string }
```

#### `leave-topic`
Leave a group channel/topic room.

```typescript
socket.emit('leave-topic', { topicId: string });
```

#### `join-chat`
Join a one-to-one chat room.

```typescript
socket.emit('join-chat', { chatId: string });
```

**Response:**
```typescript
{ success: true, chatId: string }
```

#### `leave-chat`
Leave a one-to-one chat room.

```typescript
socket.emit('leave-chat', { chatId: string });
```

#### `send-message`
Send a message via socket (optional - HTTP API is primary method).

```typescript
socket.emit('send-message', {
  topicId?: string,
  chatId?: string,
  content: string
});
```

#### `typing`
Send typing indicator.

```typescript
socket.emit('typing', {
  topicId?: string,
  chatId?: string,
  isTyping: boolean
});
```

### Server → Client Events

#### `new-message`
Receive a new message in real-time.

```typescript
socket.on('new-message', (message: Message) => {
  // Handle new message
});
```

**Message Payload:**
```typescript
{
  id: string;
  chatId?: string;
  topicId?: string;
  userId: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
  edited: boolean;
  deleted: boolean;
}
```

#### `user-typing`
Receive typing indicator.

```typescript
socket.on('user-typing', (data: {
  userId: string;
  username: string;
  isTyping: boolean;
}) => {
  // Handle typing indicator
});
```

#### `user-joined`
User joined a topic (group chat).

```typescript
socket.on('user-joined', (data: {
  userId: string;
  username: string;
  topicId: string;
}) => {
  // Handle user joined
});
```

#### `user-left`
User left a topic (group chat).

```typescript
socket.on('user-left', (data: {
  userId: string;
  username: string;
  topicId: string;
}) => {
  // Handle user left
});
```

---

## 💻 Frontend Implementation

### Socket Connection Hook

**File**: `frontend/earnings-calendar/src/hooks/useSocket.ts`

```typescript
import { useSocket } from '../../../hooks/useSocket';

const { socket, isConnected } = useSocket();
```

### Channel Chat Page

**File**: `frontend/earnings-calendar/src/features/chat/pages/ChannelChatPage.tsx`

**Key Features:**
- Joins topic room on mount
- Listens for `new-message` events
- Handles typing indicators
- Sends messages via HTTP API (socket broadcasts automatically)
- Shows connection status

**Usage:**
```typescript
// Join topic room
useEffect(() => {
  if (socket && topicId) {
    socket.emit('join-topic', { topicId });
    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleTyping);
    
    return () => {
      socket.emit('leave-topic', { topicId });
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing');
    };
  }
}, [socket, topicId]);
```

### One-to-One Chat Page

**File**: `frontend/earnings-calendar/src/features/chat/pages/OneToOneChatPage.tsx`

**Key Features:**
- Joins chat room on mount
- Listens for `new-message` events
- Handles typing indicators
- Shows online status

**Usage:**
```typescript
// Join chat room
useEffect(() => {
  if (socket && chatId) {
    socket.emit('join-chat', { chatId });
    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleTyping);
    
    return () => {
      socket.emit('leave-chat', { chatId });
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing');
    };
  }
}, [socket, chatId]);
```

### Message Bubble Component

**File**: `frontend/earnings-calendar/src/features/chat/components/MessageBubble.tsx`

**Features:**
- Left/right alignment based on sender
- Message status icons (sent, delivered, read)
- Timestamps
- Avatars with grouping
- Date separators

**Usage:**
```typescript
<MessageBubble
  message={message}
  isOwnMessage={message.userId === currentUserId}
  showAvatar={true}
  showUsername={true}
  messageStatus="delivered" // 'sent' | 'delivered' | 'read'
  prevMessage={previousMessage}
/>
```

---

## 🖥️ Backend Implementation

### Socket Gateway

**File**: `backend/adminservice/src/chat/chat.gateway.ts`

**Key Features:**
- JWT authentication on connection
- Room management (topic rooms, chat rooms)
- Message broadcasting
- Online status tracking (Redis)
- Typing indicators

### Chat Service

**File**: `backend/adminservice/src/chat/chat.service.ts`

**Key Methods:**
- `sendMessage()` - Saves message and broadcasts via socket
- `getMessages()` - Retrieves message history
- `createOneToOneChat()` - Creates private chat
- `getUsersForChat()` - Gets available users
- `getOnlineUsers()` - Gets online user IDs from Redis

### Message Flow

1. **User sends message** → HTTP POST `/api/chat/messages`
2. **ChatService.saveMessage()** → Saves to database
3. **ChatGateway.server.to(room).emit()** → Broadcasts to all in room
4. **Frontend receives** → `socket.on('new-message')` handler
5. **UI updates** → Message appears instantly

---

## 📁 File Structure

```
frontend/earnings-calendar/src/
├── features/chat/
│   ├── components/
│   │   ├── UnifiedChatLayout.tsx      # Main layout with sidebar
│   │   ├── ChannelsSidebar.tsx         # Group channels list
│   │   ├── ChatsSidebar.tsx           # Individual chats list
│   │   ├── MessageBubble.tsx          # Message component
│   │   └── UserBlockDialog.tsx        # Block user dialog
│   ├── pages/
│   │   ├── TopicsPage.tsx             # All channels page
│   │   ├── ChannelChatPage.tsx         # Group chat page
│   │   ├── ChatsListPage.tsx          # All users page
│   │   └── OneToOneChatPage.tsx       # One-to-one chat page
│   └── services/
│       └── chatApi.ts                 # RTK Query API
├── hooks/
│   └── useSocket.ts                   # Socket.IO hook

backend/adminservice/src/chat/
├── chat.gateway.ts                    # Socket.IO gateway
├── chat.service.ts                    # Business logic
├── chat.controller.ts                 # HTTP endpoints
└── dto/
    ├── send-message.dto.ts
    ├── create-topic.dto.ts
    └── block-user.dto.ts
```

---

## 🔗 Integration Guide

### 1. Socket Connection

The socket connection is automatically established when using the `useSocket()` hook:

```typescript
import { useSocket } from '../../../hooks/useSocket';

const { socket, isConnected } = useSocket();
```

**Configuration:**
- **URL**: `http://localhost:3002/chat` (or `VITE_BACKEND_WS_URL`)
- **Namespace**: `/chat`
- **Auth**: JWT token from cookies or auth context
- **Auto-reconnect**: Enabled

### 2. Sending Messages

**Primary Method (Recommended):**
```typescript
// Send via HTTP API - socket will broadcast automatically
await sendMessage({
  topicId: 'topic-id', // For group chat
  // OR
  chatId: 'chat-id',  // For one-to-one
  content: 'Hello!'
}).unwrap();
```

**Alternative (Direct Socket):**
```typescript
// Send directly via socket (faster but less reliable)
socket.emit('send-message', {
  topicId: 'topic-id',
  content: 'Hello!'
});
```

### 3. Receiving Messages

```typescript
useEffect(() => {
  if (socket && topicId) {
    const handleNewMessage = (newMessage: Message) => {
      // Add message to state
      setMessages(prev => [...prev, newMessage]);
    };
    
    socket.on('new-message', handleNewMessage);
    
    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }
}, [socket, topicId]);
```

### 4. Typing Indicators

```typescript
// Send typing indicator
const handleTyping = (isTyping: boolean) => {
  if (socket && topicId) {
    socket.emit('typing', { topicId, isTyping });
  }
};

// Receive typing indicator
socket.on('user-typing', (data) => {
  if (data.userId !== currentUserId) {
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      if (data.isTyping) {
        newSet.add(data.username);
      } else {
        newSet.delete(data.username);
      }
      return newSet;
    });
  }
});
```

---

## 📦 Example Payloads

### Join Topic
```json
{
  "topicId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Send Message (HTTP API)
```json
{
  "topicId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Hello everyone!"
}
```

### New Message Event
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "topicId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "770e8400-e29b-41d4-a716-446655440002",
  "user": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "content": "Hello everyone!",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "edited": false,
  "deleted": false
}
```

### Typing Indicator
```json
{
  "userId": "770e8400-e29b-41d4-a716-446655440002",
  "username": "john_doe",
  "isTyping": true
}
```

---

## 🚀 Production Considerations

### Scalability
- **Horizontal Scaling**: Use Redis adapter for Socket.IO to share connections across servers
- **Load Balancing**: Use sticky sessions for WebSocket connections
- **Message Queue**: Consider RabbitMQ/Kafka for high-volume messaging

### Security
- ✅ JWT authentication on socket connection
- ✅ Room-based access control
- ✅ User blocking functionality
- ✅ Input validation and sanitization

### Performance
- ✅ Message deduplication
- ✅ Efficient room management
- ✅ Redis caching for online status
- ✅ Optimistic UI updates

### Monitoring
- Track socket connection counts
- Monitor message delivery rates
- Alert on connection failures
- Log message events for debugging

---

## 📝 API Endpoints

### Messages
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages?topicId=:id&page=1&limit=50` - Get messages

### Topics/Channels
- `GET /api/chat/topics` - Get all topics
- `GET /api/chat/topics/:id` - Get topic details
- `POST /api/chat/topics` - Create topic (Admin only)

### Chats
- `GET /api/chat/chats` - Get user's chats
- `POST /api/chat/chats/one-to-one/:userId` - Create one-to-one chat
- `GET /api/chat/users` - Get users for chatting
- `GET /api/chat/users/online` - Get online users

### User Management
- `POST /api/chat/block` - Block user
- `DELETE /api/chat/block/:blockedId` - Unblock user
- `GET /api/chat/blocked` - Get blocked users

---

## ✅ Checklist

- [x] Real-time messaging (WebSocket)
- [x] No page refresh
- [x] No polling
- [x] Group chat (channels)
- [x] One-to-one chat
- [x] Search users
- [x] Search channels
- [x] Start individual chat from user list
- [x] Join/leave groups
- [x] Left sidebar (channels + chats)
- [x] Top bar with chat name
- [x] Message alignment (left/right)
- [x] Timestamps
- [x] Message status icons
- [x] User avatars
- [x] Online/offline status
- [x] Typing indicator
- [x] Message deduplication
- [x] Error handling
- [x] Responsive design

---

## 🎯 Next Steps (Optional Enhancements)

1. **Message Read Receipts**: Track when messages are read
2. **File Attachments**: Support image/file sharing
3. **Message Reactions**: Add emoji reactions
4. **Message Editing**: Edit sent messages
5. **Message Deletion**: Delete messages
6. **Voice Messages**: Audio message support
7. **Video Calls**: WebRTC integration
8. **Push Notifications**: Browser notifications
9. **Message Search**: Search within conversations
10. **Message Pinning**: Pin important messages

---

## 📞 Support

For issues or questions:
1. Check the console logs for WebSocket connection status
2. Verify JWT token is valid
3. Ensure Redis is running for online status
4. Check database connection for message persistence

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Status**: ✅ Production Ready
