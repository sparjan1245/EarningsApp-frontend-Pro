# 📋 Environment Values Extracted from docker-compose.yml

This document shows the **current development values** from your `docker-compose.yml` and what needs to be changed for production.

---

## ⚠️ CRITICAL SECURITY WARNING

**DO NOT use the development values from docker-compose.yml in production!**

The values shown below are for **reference only** - they are development/test credentials that should be replaced with secure production values.

---

## 🔍 Values Found in docker-compose.yml

### Auth Service Environment Variables

```yaml
# From docker-compose.yml (lines 70-82)
DATABASE_URL: postgresql://postgres:postgres@postgres:5432/authdb
REDIS_HOST: redis
REDIS_PORT: 6379
JWT_SECRET: your-jwt-secret-key-change-this-in-production
JWT_EXPIRATION: 15m
GOOGLE_CLIENT_ID: 389748895318-6m9dffki1nbjtm6rk97s7sfa101jogco.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET: 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
GOOGLE_CALLBACK_URL: http://localhost:3001/api/auth/oauth/google/callback
RESEND_API_KEY: re_DGcxSWQH_CBWLxuKqgqgxwLjefmtdAqmt
EMAIL_FROM: onboarding@resend.dev
PORT: 3001
NODE_ENV: production
```

### Admin Service Environment Variables

```yaml
# From docker-compose.yml (lines 109-116)
DATABASE_URL: postgresql://postgres:postgres@postgres:5432/admindb
REDIS_HOST: redis
REDIS_PORT: 6379
JWT_SECRET: your-jwt-secret-key-change-this-in-production
JWT_EXPIRATION: 30m
REFRESH_TOKEN_SECRET: your_refresh_secret_key
REFRESH_TOKEN_EXPIRATION: 7d
```

### Gateway Service Environment Variables

```yaml
# From docker-compose.yml (lines 146-151)
PORT: 3000
AUTHSERVICE_HOST: auth-service
AUTHSERVICE_PORT: 3001
ADMINSERVICE_HOST: adminservice
ADMINSERVICE_PORT: 3002
```

---

## ✅ Production-Ready .env Files Created

I've created production-ready templates in the `deployment/` folder:

1. **`gateway.env.production`** - Gateway service configuration
2. **`authservice.env.production`** - Auth service configuration  
3. **`adminservice.env.production`** - Admin service configuration

---

## 🔄 What to Replace for Production

### 1. Database Credentials

**Current (DEV)**:
- `postgresql://postgres:postgres@postgres:5432/authdb`
- `postgresql://postgres:postgres@postgres:5432/admindb`

**Production**:
- Get from cPanel → PostgreSQL Databases
- Replace: `earnings_user:YOUR_ACTUAL_PASSWORD@localhost:5432/earnings_authdb`
- Replace: `earnings_user:YOUR_ACTUAL_PASSWORD@localhost:5432/earnings_admindb`

### 2. JWT Secret

**Current (DEV)**: `your-jwt-secret-key-change-this-in-production`

**Production**: 
```bash
# Generate new secret
openssl rand -base64 32
```
- Use the **same** secret in both Auth and Admin services
- Minimum 32 characters

### 3. Refresh Token Secret

**Current (DEV)**: `your_refresh_secret_key`

**Production**:
```bash
# Generate different secret (must be different from JWT_SECRET)
openssl rand -base64 32
```

### 4. Google OAuth Credentials

**Current (DEV)**:
- Client ID: `389748895318-6m9dffki1nbjtm6rk97s7sfa101jogco.apps.googleusercontent.com`
- Client Secret: `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`
- Callback: `http://localhost:3001/api/auth/oauth/google/callback`

**Production**:
- Create new OAuth 2.0 credentials in Google Cloud Console
- Callback URL: `https://nailartsdesign.com/api/auth/oauth/google/callback`
- Replace both Client ID and Client Secret

### 5. Resend API Key

**Current (DEV)**:
- API Key: `re_DGcxSWQH_CBWLxuKqgqgxwLjefmtdAqmt`
- Email: `onboarding@resend.dev`

**Production**:
- Create new API key in Resend dashboard
- Verify domain: `nailartsdesign.com`
- Update EMAIL_FROM: `noreply@nailartsdesign.com`

### 6. Service Hosts (Gateway)

**Current (DEV)**:
- `AUTHSERVICE_HOST: auth-service`
- `ADMINSERVICE_HOST: adminservice`

**Production**: 
- Change to `localhost` (services run on same server)
- ✅ Already correct in production templates

### 7. Google OAuth Callback URL

**Current (DEV)**: `http://localhost:3001/api/auth/oauth/google/callback`

**Production**: `https://nailartsdesign.com/api/auth/oauth/google/callback`
- ✅ Already updated in production templates

---

## 📝 Quick Checklist

Before deploying to production, ensure you've replaced:

- [ ] Database passwords (from cPanel)
- [ ] JWT_SECRET (generate new, use same in both services)
- [ ] REFRESH_TOKEN_SECRET (generate new, different from JWT)
- [ ] Google OAuth Client ID (production credentials)
- [ ] Google OAuth Client Secret (production credentials)
- [ ] Resend API Key (production key)
- [ ] EMAIL_FROM (verified domain email)

---

## 🚀 Next Steps

1. **Edit the production .env files** in `deployment/` folder:
   - Replace all placeholder values
   - Generate secure secrets
   - Add production credentials

2. **Upload to server**:
   ```bash
   scp deployment/gateway.env.production username@nailartsdesign.com:~/backend/gateway/.env
   scp deployment/authservice.env.production username@nailartsdesign.com:~/backend/authservice2/.env
   scp deployment/adminservice.env.production username@nailartsdesign.com:~/backend/adminservice/.env
   ```

3. **Set secure permissions**:
   ```bash
   chmod 600 ~/backend/*/.env
   ```

4. **Verify no placeholder values remain**:
   ```bash
   grep -r "YOUR_ACTUAL_PASSWORD\|GENERATE_NEW\|YOUR_PRODUCTION" ~/backend/*/.env
   ```

---

## 🔒 Security Best Practices

1. ✅ **Never commit .env files to Git**
2. ✅ **Use different secrets for production**
3. ✅ **Set file permissions to 600** (owner read/write only)
4. ✅ **Rotate secrets periodically**
5. ✅ **Use strong, randomly generated secrets** (openssl rand -base64 32)
6. ✅ **Verify all placeholder values are replaced**

---

**Remember**: The development values in docker-compose.yml are for local development only. Always use production-ready values for your cPanel deployment!

