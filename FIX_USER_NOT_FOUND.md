# Fix: "User not found" Error When Creating Topics

## Problem
When trying to create a topic as a superadmin, you get:
```json
{
  "statusCode": 403,
  "message": "User not found",
  "details": "User not found"
}
```

## Root Cause
The user exists in the **auth-service** database but not in the **adminservice** database. These are separate databases, and users need to be synced.

## Solution

### Option 1: Sync Users (Recommended)
Sync your user account from auth-service to adminservice:

**Using Postman:**
1. Login first to get JWT token
2. Call: `POST http://localhost:3000/api/admin/sync-users`
   - Headers: `Authorization: Bearer <your-jwt-token>`
   - This will sync all users from auth-service to adminservice

**Using cURL:**
```bash
curl -X POST http://localhost:3000/api/admin/sync-users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Using Browser Console (if logged in):**
```javascript
fetch('http://localhost:3000/api/admin/sync-users', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log);
```

### Option 2: Check User Exists
Verify your user exists in adminservice database:

**Using Adminer (http://localhost:8080):**
1. Connect to: `postgresql://postgres:postgres@postgres:5432/admindb`
2. Query: `SELECT * FROM "User" WHERE email = 'your-email@example.com';`
3. If no results, sync users using Option 1

### Option 3: Manual User Creation (Not Recommended)
If sync doesn't work, you can manually create the user in adminservice database, but this is not recommended as it can cause ID mismatches.

## After Syncing
1. Try creating a topic again
2. The error should be resolved
3. Your user will now exist in both databases

## Prevention
The sync endpoint can be called periodically or set up as a cron job to automatically sync users. Currently, the automatic sync is disabled but can be enabled in `backend/adminservice/src/admin/admin.service.ts`.

## Technical Details

### Why This Happens
- **auth-service** and **adminservice** use separate PostgreSQL databases
- JWT tokens contain user ID from auth-service
- adminservice looks up users in its own database
- If user doesn't exist in adminservice, lookup fails

### What Was Fixed
1. Added email-based user lookup as fallback
2. Added sync endpoint to gateway
3. Improved error messages
4. Added logging for debugging

## Verification
After syncing, check logs:
```bash
docker-compose logs adminservice | grep -i "synced"
```

You should see: `Synced X users from auth service`

