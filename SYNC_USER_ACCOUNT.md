# Quick Fix: Sync Your User Account

## Problem
You're getting this error when trying to send messages:
```
403 Forbidden: "User not found in admin service. Please ensure your account is synced."
```

## Quick Solution (Browser Console)

Since you're already logged in, open your browser's developer console (F12) and run:

```javascript
fetch('/api/admin/sync-users', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Sync successful!', data);
  alert('Account synced successfully! You can now send messages.');
})
.catch(err => {
  console.error('❌ Sync failed:', err);
  alert('Sync failed. Please check console for details.');
});
```

## After Syncing

1. **Refresh the page** or try sending a message again
2. The error should be resolved
3. You'll be able to send messages in chat

## What This Does

This syncs all users from the `auth-service` database to the `adminservice` database. Your user account will be created/updated in the adminservice, allowing you to:
- Send messages in chat
- Create topics (if you're admin/superadmin)
- Participate in discussions

## Alternative: Using Postman/cURL

If you prefer using an API client:

```bash
curl -X POST http://localhost:3000/api/admin/sync-users \
  -H "Cookie: access=YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Note

You need to be logged in as **ADMIN** or **SUPERADMIN** to run the sync. Regular users cannot sync accounts themselves.

