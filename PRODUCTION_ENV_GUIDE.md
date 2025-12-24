# 🔐 Production Environment Variables Guide

Based on your actual codebase, here are the **complete environment variable configurations** you need for production deployment.

**⚠️ IMPORTANT**: The values shown in `docker-compose.yml` are **DEVELOPMENT credentials** - DO NOT use them in production!

---

## 🌐 Your Production Domain

Based on your code, your production domain is: **`nailartsdesign.com`**

This is already configured in your CORS settings in:
- `backend/gateway/src/main.ts`
- `backend/authservice2/src/main.ts`
- `backend/adminservice/src/main.ts`

---

## 📝 Gateway Service (.env)

**Location**: `~/backend/gateway/.env`

```env
PORT=3000
NODE_ENV=production
AUTHSERVICE_HOST=localhost
AUTHSERVICE_PORT=3001
ADMINSERVICE_HOST=localhost
ADMINSERVICE_PORT=3002

# Low memory optimization (adjust based on available RAM)
# 1GB server: --max-old-space-size=256
# 2GB server: --max-old-space-size=512
# 4GB+ server: --max-old-space-size=1024
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
```

**✅ No changes needed** - This is complete for production.

---

## 🔑 Auth Service (.env)

**Location**: `~/backend/authservice2/.env`

```env
PORT=3001
NODE_ENV=production

# Database Configuration (PostgreSQL 13.22)
# ⚠️ REPLACE with your actual PostgreSQL credentials from cPanel
# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL=postgresql://earnings_user:YOUR_ACTUAL_PASSWORD@localhost:5432/earnings_authdb?connection_limit=5&pool_timeout=20
DATABASE_POOL_SIZE=5

# Redis Configuration
# If Redis is not available, your code will use in-memory cache as fallback
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
# ⚠️ CRITICAL: Generate a STRONG random secret (minimum 32 characters)
# Use: openssl rand -base64 32  (generates secure random string)
JWT_SECRET=GENERATE_NEW_STRONG_SECRET_MIN_32_CHARS_FOR_PRODUCTION
JWT_EXPIRATION=15m

# Google OAuth Configuration
# ⚠️ REPLACE with your production Google OAuth credentials
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=YOUR_PRODUCTION_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_PRODUCTION_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=https://nailartsdesign.com/api/auth/oauth/google/callback

# Email Configuration (Resend)
# ⚠️ REPLACE with your production Resend API key
# Get from: https://resend.com/api-keys
RESEND_API_KEY=YOUR_PRODUCTION_RESEND_API_KEY
EMAIL_FROM=noreply@nailartsdesign.com

# Low memory optimization (adjust based on available RAM)
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
```

**🔴 Values you MUST replace**:
1. `YOUR_ACTUAL_PASSWORD` - Your PostgreSQL database password
2. `GENERATE_NEW_STRONG_SECRET_MIN_32_CHARS_FOR_PRODUCTION` - Generate with: `openssl rand -base64 32`
3. `YOUR_PRODUCTION_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
4. `YOUR_PRODUCTION_GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret
5. `YOUR_PRODUCTION_RESEND_API_KEY` - Your Resend API key
6. `noreply@nailartsdesign.com` - Your verified sender email in Resend

---

## 👨‍💼 Admin Service (.env)

**Location**: `~/backend/adminservice/.env`

```env
PORT=3002
NODE_ENV=production

# Database Configuration (PostgreSQL 13.22)
# ⚠️ REPLACE with your actual PostgreSQL credentials from cPanel
DATABASE_URL=postgresql://earnings_user:YOUR_ACTUAL_PASSWORD@localhost:5432/earnings_admindb?connection_limit=5&pool_timeout=20
DATABASE_POOL_SIZE=5

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
# ⚠️ CRITICAL: Use the SAME JWT_SECRET as Auth Service
# Generate once and use the same value in both services
JWT_SECRET=USE_SAME_SECRET_AS_AUTH_SERVICE
JWT_EXPIRATION=30m

# Refresh Token Configuration
# ⚠️ Generate a different secret for refresh tokens
REFRESH_TOKEN_SECRET=GENERATE_DIFFERENT_SECRET_FOR_REFRESH_TOKENS_MIN_32_CHARS
REFRESH_TOKEN_EXPIRATION=7d

# Low memory optimization (adjust based on available RAM)
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
```

**🔴 Values you MUST replace**:
1. `YOUR_ACTUAL_PASSWORD` - Your PostgreSQL database password (same as Auth Service)
2. `USE_SAME_SECRET_AS_AUTH_SERVICE` - **Must match** JWT_SECRET from Auth Service
3. `GENERATE_DIFFERENT_SECRET_FOR_REFRESH_TOKENS_MIN_32_CHARS` - Generate with: `openssl rand -base64 32`

---

## 🔒 Security Checklist

### ✅ Generate Secure Secrets

**On your local machine or server**:
```bash
# Generate JWT Secret (use same in both Auth and Admin services)
openssl rand -base64 32

# Generate Refresh Token Secret (different from JWT secret)
openssl rand -base64 32
```

**Copy the output and use it in your .env files**.

### ✅ Update Database Credentials

1. **Get from cPanel**:
   - Login to cPanel → PostgreSQL Databases
   - Copy your database username
   - Copy your database password
   - Note database names: `earnings_authdb` and `earnings_admindb`
   - Note host (usually `localhost`)
   - Note port (usually `5432`)

2. **Update DATABASE_URL** in both Auth and Admin services

### ✅ Configure Google OAuth for Production

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Create OAuth 2.0 Client ID** (if not exists)
3. **Authorized redirect URIs**: 
   - Add: `https://nailartsdesign.com/api/auth/oauth/google/callback`
   - Add: `https://www.nailartsdesign.com/api/auth/oauth/google/callback`
4. **Copy Client ID and Client Secret** to .env file

### ✅ Configure Resend Email Service

1. **Go to**: https://resend.com/
2. **Create account** (if not exists)
3. **Verify your domain**: `nailartsdesign.com`
4. **Create API Key** → Copy to `RESEND_API_KEY`
5. **Update EMAIL_FROM**: Use verified email like `noreply@nailartsdesign.com`

---

## 📋 Quick Setup Script

**Create .env files on server**:

```bash
# SSH to your server
ssh username@nailartsdesign.com

# Gateway Service
cd ~/backend/gateway
cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
AUTHSERVICE_HOST=localhost
AUTHSERVICE_PORT=3001
ADMINSERVICE_HOST=localhost
ADMINSERVICE_PORT=3002
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
EOF

# Auth Service (EDIT VALUES BELOW)
cd ~/backend/authservice2
nano .env
# Paste the Auth Service template above
# Edit and replace all placeholder values
# Save: Ctrl+X, Y, Enter

# Admin Service (EDIT VALUES BELOW)
cd ~/backend/adminservice
nano .env
# Paste the Admin Service template above
# Edit and replace all placeholder values
# Save: Ctrl+X, Y, Enter
```

---

## 🧪 Verify Configuration

After creating .env files, verify they're correct:

```bash
# Check if files exist
ls -la ~/backend/*/.env

# Verify no placeholder values remain (should show matches)
grep -r "YOUR_ACTUAL_PASSWORD\|GENERATE_NEW\|YOUR_PRODUCTION" ~/backend/*/.env && echo "⚠️ Warning: Placeholder values found!" || echo "✅ All placeholders replaced"

# Check file permissions (should be 600 for security)
ls -l ~/backend/*/.env
# If not 600, set: chmod 600 ~/backend/*/.env
```

---

## ⚠️ Important Notes

1. **Never commit .env files to Git** - They contain secrets!
2. **Use different secrets for production** - Don't use development secrets
3. **JWT_SECRET must be the same** in both Auth and Admin services
4. **REFRESH_TOKEN_SECRET should be different** from JWT_SECRET
5. **Google OAuth callback URL** must match exactly: `https://nailartsdesign.com/api/auth/oauth/google/callback`
6. **Database passwords** should be strong and unique
7. **File permissions**: Set .env files to 600 (read/write owner only)

---

## 🆘 If Something Doesn't Work

1. **Check logs**: `tail -f ~/backend/*/logs/*.log`
2. **Verify environment variables are loaded**: Check Node.js Selector environment settings
3. **Test database connection**: `psql $DATABASE_URL -c "SELECT 1;"`
4. **Verify secrets are not placeholders**: Check .env files manually
5. **Check CORS configuration**: Verify domain is correct in main.ts files

---

## 📞 Next Steps

After configuring .env files:
1. ✅ Install dependencies (Step 5.2)
2. ✅ Generate Prisma clients (Step 6)
3. ✅ Run migrations (Step 7)
4. ✅ Configure Node.js applications (Step 8)
5. ✅ Test deployment

See `DEPLOYMENT_NEXT_STEPS.md` for complete deployment process.

---

**Good luck with your deployment! 🚀**

