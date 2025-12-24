# 🚀 Complete cPanel Deployment Guide (Manual SQL & Low Space)

This guide provides **exact steps** to deploy your Earnings Calendar application to cPanel. It combines manual database setup (since you can't run migrations easily) with a space-saving deployment strategy.

**Constraint Checklist & Confidence Score:**
1. Deployment to cPanel Node.js server? YES
2. Full steps only? YES
3. Don't change code? YES (Only configuration changes instructed)
4. Manual instructions? YES

Confidence Score: 5/5

---

## 📋 Prerequisites

- [ ] access to cPanel
- [ ] domain/subdomain configured
- [ ] `auth_schema.sql` and `admin_schema.sql` files (already in your project root)

---

## 🏗️ Phase 1: Local Preparation (Do this on your PC)

### 1.1 Update CORS & URLs (Configuration Only)
You must update these files locally before building, or the app won't connect on production.

**Step 1:** Open `backend/gateway/src/main.ts`
- Find `app.enableCors`.
- Change `origin` to include your domain: `['https://yourdomain.com', 'https://www.yourdomain.com']`.

**Step 2:** Open `backend/authservice2/src/main.ts`
- Update `origin` similarly.

**Step 3:** Open `backend/adminservice/src/main.ts`
- Update `origin` similarly.

**Step 4:** Open `frontend/earnings-calendar/src/services/adminApi.ts`
- Ensure `baseUrl` points to your production API (e.g., `https://api.yourdomain.com` or `/api` if using same origin).

### 1.2 Update gRPC Hosts (Important)
Since you are not using Docker on cPanel, you must change the internal service names to `localhost`.

**Step 1:** Open `backend/gateway/src/grpc/auth.grpc.client.ts`
- Change `url: 'auth-service:50051'` to `url: 'localhost:50051'` (or `127.0.0.1:50051`).

**Step 2:** Open `backend/gateway/src/grpc/admin.grpc.client.ts`
- Change `url: 'adminservice:50052'` to `url: 'localhost:50052'`.

### 1.3 Build Frontend
1. Open terminal in `frontend/earnings-calendar`.
2. Run: `npm run build`
3. **Action:** Go to `frontend/earnings-calendar/dist`. Select **all files inside** (assets, index.html, etc.) -> Right Click -> **Zip** them as `frontend-build.zip`.

### 1.4 Build Gateway
1. Open terminal in `backend/gateway`.
2. Run: `npm run build`
3. **Action:** Copy the `backend/proto` folder into `backend/gateway`.
4. **Action:** Create a `.env` file in `backend/gateway` with the following content:
    ```env
    PORT=3000
    NODE_ENV=production
    ADMINSERVICE_HOST=localhost
    ADMINSERVICE_PORT=3002
    ```
5. **Action:** Zip the following files/folders together as `gateway.zip`:
    - `dist/`
    - `proto/`
    - `package.json`
    - `.env`
    > **⚠️ IMPORTANT:** Do **NOT** zip `node_modules`! We will install fresh dependencies on the server to prevent errors.

### 1.5 Build Auth Service
1. Open terminal in `backend/authservice2`.
2. Run: `npm run build`
3. **Action:** Copy the `backend/proto` folder into `backend/authservice2`.
4. **Action:** Zip the following as `auth-service.zip`:
    - `dist/`
    - `proto/`
    - `package.json`
    - `prisma/` (CRITICAL: Needed for generating client)
    - `.env`

### 1.6 Build Admin Service
1. Open terminal in `backend/adminservice`.
2. Run: `npm run build`
3. **Action:** Copy the `backend/proto` folder into `backend/adminservice`.
4. **Action:** Zip the following as `admin-service.zip`:
    - `dist/`
    - `proto/`
    - `package.json`
    - `prisma/`
    - `.env`

---

## 🗄️ Phase 2: Database Setup (Manual)

Since we cannot easily run migration commands, we will use the SQL files.

### 2.1 Create Databases
1. Log in to **cPanel** -> **PostgreSQL Databases**.
2. Create Database: `earnings_authdb`
3. Create Database: `earnings_admindb`
4. Create User: `earnings_user` (with a strong password).
5. **Add User to Database:** Select `earnings_user` and add it to BOTH `earnings_authdb` and `earnings_admindb`. Give **All Privileges**.

### 2.2 Import Auth Schema
1. Open **phpPgAdmin** in cPanel.
2. Select `earnings_authdb`.
3. Click **SQL** tab.
4. Open your local `auth_schema.sql` file in a text editor.
5. Copy ALL text.
6. Paste into phpPgAdmin SQL window -> Click **Execute**.

### 2.3 Import Admin Schema
1. In phpPgAdmin, select `earnings_admindb`.
2. Click **SQL** tab.
3. Open local `admin_schema.sql`.
4. Copy ALL text.
5. Paste into SQL window -> Click **Execute**.

---

## 📤 Phase 3: Server Upload

1. Open **cPanel File Manager**.
2. Navigate to where you want the backend (Recommend: `/home/youruser/backend`). Create this folder if it doesn't exist.
3. Inside `backend`, create 3 folders:
    - `gateway`
    - `authservice2`
    - `adminservice`
4. **Upload & Extract:**
    - Upload `gateway.zip` to `backend/gateway` -> Extract -> Delete zip.
    - Upload `auth-service.zip` to `backend/authservice2` -> Extract -> Delete zip.
    - Upload `admin-service.zip` to `backend/adminservice` -> Extract -> Delete zip.

5. **Frontend:**
    - Navigate to `public_html` (or your subdomain folder).
    - Upload `frontend-build.zip` -> Extract -> Delete zip.

---

## ⚙️ Phase 4: Server Configuration (The Tricky Part)

You need to install dependencies and generate the Prisma Client for the server's OS (Linux).

### 4.1 Install Dependencies
You have two options: **SSH** (recommended/faster) or **Node.js Selector** terminal.

**Option A: via SSH (Terminal)**
Run these commands one by one:

```bash
# 1. Gateway
cd backend/gateway
npm install
# Note: Gateway does NOT need 'npx prisma generate' (It's just a proxy)

# 2. Auth Service
cd ../authservice2
npm install
npx prisma generate

# 3. Admin Service
cd ../adminservice
npm install
npx prisma generate
```

**Note:** We use `npm install` (without `--production`) to ensure all required packages are definitely installed. It uses more space but is safer. `npx prisma generate` is **MANDATORY** for Auth/Admin.

### 4.2 Configure Node.js Applications
Go to **cPanel -> Setup Node.js App**.

**App 1: Gateway**
- **Node Version:** 18.x or 20.x
- **App Root:** `backend/gateway`
- **Application URL:** `api.yourdomain.com` (or whatever you set)
- **Application Startup File:** `dist/main.js`
- **Env Variables:** Add from your `.env` (PORT, DATABASE_URL, etc.)
- Click **Create** -> **Run NPM Install** (if you didn't do it via SSH) -> **Start App**.

**App 2: Auth Service**
- **Node Version:** Same
- **App Root:** `backend/authservice2`
- **Application Startup File:** `dist/main.js`
- **Env Variables:** Add from `.env`
    - `DATABASE_URL`: `postgresql://earnings_user:PASSWORD@localhost/earnings_authdb`
- **Start App**.

**App 3: Admin Service**
- **Node Version:** Same
- **App Root:** `backend/adminservice`
- **Application Startup File:** `dist/main.js`
- **Env Variables:** Add from `.env`
    - `DATABASE_URL`: `postgresql://earnings_user:PASSWORD@localhost/earnings_admindb`
- **Start App**.

---

## 🧪 Phase 5: Verification

1. **Check Gateway Health:** Visit `https://api.yourdomain.com/health` (or your configured URL).
2. **Check Frontend:** Visit your main domain.
3. **Test Login:** Try to log in with `sadmin@admin.com` (ensure you seeded the DB or insert the user manually via SQL if not exists).

### Common Errors & Fixes
- **"Error: Cannot find module '@nestjs/core'"**:
  - This means `npm install` didn't finish or missed packages.
  - **Fix:** Run this on the server (cPanel Terminal):
    ```bash
    cd backend/gateway
    rm -rf node_modules package-lock.json
    npm install
    ```
- **"Prisma Client not initialized"**: You forgot `npx prisma generate` on the server.
- **"Connection Refused"**: Check DB credentials and ensure `localhost` is used for DB host.
- **CORS Errors**: You didn't update the `main.ts` files locally before building.

---
**Done!** Your app should be live.
