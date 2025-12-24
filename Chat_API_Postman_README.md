# Chat API Postman Collection

Complete Postman collection for testing the Chat/Discussion module API endpoints.

## 📥 Import Instructions

1. Open Postman
2. Click **Import** button (top left)
3. Select `Chat_API_Postman_Collection.json`
4. The collection will be imported with all folders and requests

## 🔧 Setup

### Environment Variables

The collection uses the following variables (automatically set or you can set manually):

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `base_url` | `http://localhost:3000` | API Gateway URL (or `http://localhost:5173` for frontend proxy) |
| `jwt_token` | (auto-set) | JWT token from login |
| `user_id` | (auto-set) | Current user ID |
| `topic_id` | (manual) | Topic UUID from responses |
| `chat_id` | (manual) | Chat UUID from responses |
| `other_user_id` | (manual) | User ID for one-to-one chat |
| `user_to_block_id` | (manual) | User ID to block |
| `user_to_suspend_id` | (manual) | User ID to suspend (Admin only) |

### Quick Start

1. **Set Base URL**: 
   - Option 1: Use Gateway directly: `http://localhost:3000`
   - Option 2: Use Frontend proxy: `http://localhost:5173`

2. **Login First**:
   - Go to **Authentication** → **Login (Get JWT Token)**
   - Update email/password in the request body
   - Send request
   - JWT token will be automatically saved to `jwt_token` variable

3. **Test Endpoints**:
   - All authenticated endpoints will use the saved JWT token automatically
   - Bearer token authentication is pre-configured

## 📁 Collection Structure

### 1. Authentication
- **Login (Get JWT Token)**: Login and automatically save JWT token

### 2. Topics
- **Get All Topics (Public)**: No auth required
- **Get Topic By ID (Public)**: No auth required
- **Create Topic (Admin Only)**: Requires ADMIN or SUPERADMIN role

### 3. Messages
- **Send Message to Topic**: Send message to a topic discussion
- **Send Message to Chat**: Send message to one-to-one chat
- **Get Messages from Topic**: Get paginated messages from topic
- **Get Messages from Chat**: Get paginated messages from chat

### 4. Chats
- **Get User Chats**: Get all chats for authenticated user
- **Create One-to-One Chat**: Create direct chat with another user

### 5. User Blocking
- **Block User**: Block a user from messaging you
- **Unblock User**: Remove block on a user
- **Get Blocked Users**: List all blocked users

### 6. Admin Functions
- **Suspend User**: Suspend a user (Admin only)
- **Unsuspend User**: Remove suspension (Admin only)

## 🔐 Authentication

Most endpoints require JWT authentication:
- Token is automatically included via Bearer authentication
- Token is saved after login in the **Authentication** folder
- If token expires, re-run the Login request

## 📝 Example Workflow

### 1. Create a Topic (Admin)
```
1. Login → Get JWT token
2. Topics → Create Topic
   Body: {
     "title": "New Discussion",
     "description": "Topic description"
   }
3. Copy topic ID from response
4. Set topic_id variable
```

### 2. Send a Message
```
1. Messages → Send Message to Topic
   Body: {
     "topicId": "{{topic_id}}",
     "content": "Hello everyone!"
   }
```

### 3. Get Messages
```
1. Messages → Get Messages from Topic
   Query: topicId={{topic_id}}&page=1&limit=50
```

### 4. Create One-to-One Chat
```
1. Chats → Create One-to-One Chat
   URL: /api/chat/chats/one-to-one/{{other_user_id}}
```

### 5. Block a User
```
1. User Blocking → Block User
   Body: {
     "blockedId": "{{user_to_block_id}}",
     "reason": "Inappropriate behavior"
   }
```

## 🎯 Role-Based Access

| Endpoint | USER | ADMIN | SUPERADMIN |
|----------|------|-------|------------|
| Get Topics | ✅ | ✅ | ✅ |
| Create Topic | ❌ | ✅ | ✅ |
| Send Messages | ✅ | ✅ | ✅ |
| Get Chats | ✅ | ✅ | ✅ |
| Block Users | ✅ | ✅ | ✅ |
| Suspend Users | ❌ | ✅ | ✅ |

## 🐛 Troubleshooting

### 401 Unauthorized
- Token expired → Re-run Login request
- Invalid token → Check token in environment variables

### 403 Forbidden
- Insufficient permissions → Check user role
- Admin endpoints require ADMIN or SUPERADMIN role

### 404 Not Found
- Check base_url is correct
- Ensure services are running (docker-compose up)

### 405 Method Not Allowed
- Check HTTP method (GET, POST, PUT, DELETE)
- Verify endpoint path is correct

## 📌 Notes

- All endpoints use `/api/chat` prefix
- Gateway URL: `http://localhost:3000`
- Frontend proxy URL: `http://localhost:5173`
- JWT tokens expire after 60 minutes (default)
- Use cookies for browser-based testing
- Use Bearer token for Postman/API testing

## 🔄 Cookie-Based Auth (Alternative)

If you prefer cookie-based authentication:
1. Remove Bearer token from request auth
2. Add Cookie header manually:
   ```
   Cookie: access={{jwt_token}}
   ```
3. Ensure `credentials: 'include'` in frontend requests

## 📚 Related Documentation

- See `backend/adminservice/CHAT_API_DOCUMENTATION.md` for detailed API docs
- See `README.md` for application setup instructions

