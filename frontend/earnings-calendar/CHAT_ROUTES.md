# Chat Module - Frontend Structure & Routes

## 📁 Folder Structure

```
frontend/earnings-calendar/src/
├── features/
│   ├── chat/
│   │   ├── components/
│   │   │   └── UserBlockDialog.tsx      # User blocking dialog component
│   │   └── pages/
│   │       ├── TopicsPage.tsx           # Public topics list page
│   │       ├── ChannelChatPage.tsx      # Topic discussion chat page
│   │       ├── OneToOneChatPage.tsx     # One-to-one chat page
│   │       └── ChatsListPage.tsx        # User's chat list page
│   ├── admin/
│   │   └── ChatManagementPage.tsx       # Admin chat management
│   └── dashboard/
│       └── components/
│           └── ChatIconButton.tsx       # Chat icon in header
├── hooks/
│   └── useSocket.ts                     # Socket.io hook
├── services/
│   └── chatApi.ts                       # RTK Query API slice
└── App.tsx                              # Main routing configuration
```

## 🛣️ Routes Configuration

All chat routes are defined in `App.tsx`:

### Public Routes (No Auth Required)
- `/chat/topics` - View all discussion topics (public)
  - Component: `TopicsPage`
  - Description: Lists all active topics, allows viewing without login

### Authenticated Routes (Login Required)
- `/chat/topic/:topicId` - Join topic discussion
  - Component: `ChannelChatPage`
  - Description: Real-time chat interface for topic discussions
  
- `/chat/chats` - User's chat list
  - Component: `ChatsListPage`
  - Description: Shows all user's chats (topics and one-to-one)
  
- `/chat/one-to-one/:chatId` - One-to-one chat
  - Component: `OneToOneChatPage`
  - Description: Private chat between two users

### Admin Routes (Admin/SuperAdmin Only)
- `/admin/chat` - Chat management
  - Component: `ChatManagementPage`
  - Description: Admin interface to manage topics and users

## 🎨 Layout Structure

All chat pages follow the Dashboard layout pattern:

```tsx
<Box sx={{ 
  width: '100%',
  minHeight: '100vh',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  '&::before': {
    // Gradient background
  }
}}>
  <Box sx={{
    width: '100%',
    maxWidth: { xs: '100%', sm: '100%', md: '1400px', lg: '1600px' },
    mx: 'auto',
    px: { xs: 2, sm: 3, md: 4, lg: 6 },
    py: { xs: 3, sm: 4, md: 5, lg: 6 },
    // Content here
  }}>
    {/* Page Content */}
  </Box>
</Box>
```

## 🔗 Navigation Flow

1. **Dashboard** → Click Chat Icon → `/chat/topics`
2. **Topics Page** → Click "Join Discussion" → `/chat/topic/:topicId`
3. **Topics Page** → Click "My Chats" → `/chat/chats`
4. **Chats List** → Click chat item → `/chat/one-to-one/:chatId` or `/chat/topic/:topicId`
5. **Admin Dashboard** → Click "Chat Management" → `/admin/chat`

## ✅ Fixed Issues

1. **JSX Syntax Error**: Added missing closing `</Box>` tag in `OneToOneChatPage.tsx`
2. **Type Import**: Fixed `ChatType` to `Chat` type import
3. **Layout Consistency**: All pages now use consistent Dashboard layout structure
4. **Folder Structure**: Properly organized with `components/` and `pages/` subdirectories

## 📝 Notes

- All chat pages are responsive and follow Material-UI design patterns
- Socket.io integration is handled via `useSocket` hook
- Real-time updates work through Socket.io events
- User blocking functionality is available in chat interfaces
- Admin can create topics and manage users from `/admin/chat`

