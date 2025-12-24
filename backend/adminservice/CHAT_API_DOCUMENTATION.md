# Chat API Documentation - Role-Based Access Control

## 🔐 Authentication & Authorization

### Role Types
- **USER**: Regular user (default)
- **ADMIN**: Administrator
- **SUPER_ADMIN**: Super Administrator (highest privilege)

## 📋 API Endpoints by Role

### 🌐 Public Endpoints (No Auth Required)

#### `GET /api/chat/topics`
- **Description**: Get all active topics
- **Auth**: None required
- **Response**: Array of topics with creator info and chat statistics

#### `GET /api/chat/topics/:id`
- **Description**: Get topic details by ID
- **Auth**: None required
- **Response**: Topic with full details including chat members

---

### 👤 User Endpoints (Auth Required)

#### `POST /api/chat/messages`
- **Description**: Send a message to a topic or chat
- **Auth**: JWT required
- **Roles**: USER, ADMIN, SUPER_ADMIN
- **Body**: `{ topicId?: string, chatId?: string, content: string }`
- **Restrictions**: 
  - User must be a member of the chat/topic
  - User must not be suspended
  - User must not be blocked by other members

#### `GET /api/chat/messages`
- **Description**: Get messages from a topic or chat
- **Auth**: JWT required
- **Roles**: USER, ADMIN, SUPER_ADMIN
- **Query Params**: `topicId`, `chatId`, `page`, `limit`
- **Restrictions**: User must be a member of the chat/topic

#### `POST /api/chat/chats/one-to-one/:userId`
- **Description**: Create a one-to-one chat with another user
- **Auth**: JWT required
- **Roles**: USER, ADMIN, SUPER_ADMIN
- **Restrictions**: Cannot create chat with yourself

#### `GET /api/chat/chats`
- **Description**: Get all chats for the authenticated user
- **Auth**: JWT required
- **Roles**: USER, ADMIN, SUPER_ADMIN
- **Response**: Array of chats (topics and one-to-one)

#### `POST /api/chat/block`
- **Description**: Block a user
- **Auth**: JWT required
- **Roles**: USER, ADMIN, SUPER_ADMIN
- **Body**: `{ blockedId: string, reason?: string }`
- **Restrictions**: Cannot block yourself

#### `DELETE /api/chat/block/:blockedId`
- **Description**: Unblock a user
- **Auth**: JWT required
- **Roles**: USER, ADMIN, SUPER_ADMIN

#### `GET /api/chat/blocked`
- **Description**: Get list of blocked users
- **Auth**: JWT required
- **Roles**: USER, ADMIN, SUPER_ADMIN

---

### 👑 Admin & Super Admin Endpoints

#### `POST /api/chat/topics`
- **Description**: Create a new discussion topic
- **Auth**: JWT required
- **Roles**: **ADMIN, SUPER_ADMIN**
- **Body**: `{ title: string, description?: string }`
- **Response**: Created topic with associated chat

---

### 🛡️ Admin & Super Admin Endpoints

#### `PUT /api/chat/users/:userId/suspend`
- **Description**: Suspend a user (prevents sending messages)
- **Auth**: JWT required
- **Roles**: **ADMIN, SUPER_ADMIN**
- **Restrictions**: 
  - Admin cannot suspend another admin
  - Only SUPER_ADMIN can suspend another SUPER_ADMIN

#### `PUT /api/chat/users/:userId/unsuspend`
- **Description**: Unsuspend a user
- **Auth**: JWT required
- **Roles**: **ADMIN, SUPER_ADMIN**
- **Restrictions**: Same as suspend

---

## 🔒 Security Implementation

### Controller Level
- `@UseGuards(JwtAuthGuard)` - Ensures user is authenticated
- `@UseGuards(RolesGuard)` - Validates user role
- `@Roles(UserRole.SUPERADMIN)` - Restricts to specific role(s)

### Service Level
- Double-checks user role in database
- Validates user permissions before operations
- Checks for suspended users
- Validates chat membership

### Example Controller Pattern:
```typescript
@Post('topics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
async createTopic(@Request() req, @Body() dto: CreateTopicDto) {
  return this.chatService.createTopic(req.user.userId, dto);
}
```

---

## 📊 Role Permissions Matrix

| Feature | USER | ADMIN | SUPER_ADMIN |
|---------|------|-------|-------------|
| View Topics | ✅ | ✅ | ✅ |
| Create Topics | ❌ | ✅ | ✅ |
| Send Messages | ✅ | ✅ | ✅ |
| Create One-to-One Chat | ✅ | ✅ | ✅ |
| Block Users | ✅ | ✅ | ✅ |
| Suspend Users | ❌ | ✅ | ✅ |
| View All Chats | ✅ | ✅ | ✅ |

---

## 🐛 Common Issues

### Role Mismatch
- **Issue**: Enum uses `SUPERADMIN` but DB uses `SUPER_ADMIN`
- **Solution**: Service checks for both variants
- **Location**: `chat.service.ts` - role validation logic

### Missing Authentication
- **Issue**: Endpoint tries to access `req.user` without guard
- **Solution**: Always use `@UseGuards(JwtAuthGuard)` before accessing `req.user`

### Role Guard Not Working
- **Issue**: Role check fails even with correct role
- **Solution**: Ensure JWT payload includes role field and matches enum values

---

## ✅ Testing Checklist

- [ ] Super Admin can create topics
- [ ] Regular users cannot create topics
- [ ] All authenticated users can send messages
- [ ] Suspended users cannot send messages
- [ ] Admin can suspend users
- [ ] Regular users cannot suspend users
- [ ] Users can block/unblock other users
- [ ] Blocked users cannot message blocker
- [ ] Public endpoints work without auth
- [ ] Protected endpoints require auth

