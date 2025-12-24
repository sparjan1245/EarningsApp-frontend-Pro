# 🚀 Manual cPanel Deployment Guide (Low Space & SQL)

This guide is optimized for a **manual deployment** where you:
1.  **Manually create database tables** using SQL (no command line migrations).
2.  **Optimize for low disk space** (uploading only what's necessary).
3.  Deploy a pre-built storage-efficient application.

---

## 🏗️ Part 1: Database Setup (Manual SQL)

Since you want to avoid running migrations via SSH, we will run them manually.

### 1.1 Create Databases
1.  Log in to **cPanel**.
2.  Go to **PostgreSQL Databases**.
3.  Create two databases:
    *   `earnings_authdb`
    *   `earnings_admindb`
4.  Create a user (e.g., `earnings_user`) and password.
5.  **Add User to Database**: Assign `earnings_user` to both `earnings_authdb` and `earnings_admindb` with **ALL PRIVILEGES**.

### 1.2 Run SQL for Auth Service
1.  Open **phpPgAdmin** (from cPanel).
2.  Select `earnings_authdb` on the left.
3.  Click the **SQL** tab.
4.  Open the local file `auth_schema.sql` (in your project root).
5.  **Copy and Paste** the entire content into the SQL window.
6.  Click **Execute**.
    *   *Success*: You should see `User` and `RefreshToken` tables appear.

### 1.3 Run SQL for Admin Service
1.  In **phpPgAdmin**, select `earnings_admindb` on the left.
2.  Click the **SQL** tab.
3.  Open the local file `admin_schema.sql` (in your project root).
4.  **Copy and Paste** the entire content into the SQL window.
5.  Click **Execute**.
    *   *Success*: You should see tables like `User`, `Chat`, `FinancialRecord`, etc.

---

## 📤 Part 2: Low-Space Backend Deployment

To save space and bandwidth, we will **ZIP locally** and **Install dependencies on Server**.

### 2.1 Prepare Gateway Service
1.  Navigate to `backend/gateway`.
2.  Select **only** these files/folders:
    *   `dist/` (folder)
    *   `package.json`
    *   `.env` (create/update this first!)
3.  **Right-click → Send to → Compressed (zipped) folder**. Name it `gateway.zip`.

### 2.2 Prepare Auth Service
1.  Navigate to `backend/authservice2`.
2.  Select:
    *   `dist/`
    *   `prisma/` (Important: schema is needed for client, but we won't migrate)
    *   `package.json`
    *   `.env`
3.  **Zip** them as `auth-service.zip`.

### 2.3 Prepare Admin Service
1.  Navigate to `backend/adminservice`.
2.  Select:
    *   `dist/`
    *   `prisma/`
    *   `package.json`
    *   `.env`
3.  **Zip** them as `admin-service.zip`.

### 2.4 Upload and Extract
1.  In **cPanel File Manager**, go to your folder (e.g., `public_html/backend`).
2.  Create folders: `gateway`, `auth-service`, `admin-service`.
3.  **Upload** the respective ZIP files into each folder.
4.  **Extract** each ZIP.
5.  **Delete the ZIP files** immediately to save space.

### 2.5 Install Dependencies (The Space-Saving Way)
Instead of uploading huge `node_modules`, run this in **cPanel Terminal** or **Node.js App Selector**:

```bash
# Gateway
cd backend/gateway
npm install --production

# Auth Service
cd backend/auth-service
npm install --production
npx prisma generate

# Admin Service
cd backend/admin-service
npm install --production
npx prisma generate
```

> **Note**: The `--production` flag skips dev dependencies (testing tools, etc.), saving significant space. `npx prisma generate` is required to create the client files.

---

## 🌐 Part 3: Frontend Deployment

1.  Navigate to `frontend/earnings-calendar`.
2.  **Zip** the contents of the `dist` folder (files like `index.html`, `assets/`, etc.). **Do not zip the `dist` folder itself**, zip the *contents*.
3.  Upload to `public_html/app` (or your desired frontend path).
4.  **Extract**.

---

## ⚙️ Part 4: Node.js Configuration

1.  Go to **Node.js Selector** in cPanel.
2.  Create apps for each service pointing to the deployed paths.
3.  **Startup File**:
    *   **Gateway**: `dist/main.js`
    *   **Admin Service**: `dist/main.js`
    *   **Auth Service**: `dist/src/main.js` (Important: Check your build output!)
4.  **Run Application**.

---

## 🚑 Troubleshooting

**"Relation does not exist" error:**
*   Re-run the SQL script for that service.
*   Check if you are in the correct database (`earnings_admindb` vs `earnings_authdb`).

**"Disk Quota Exceeded":**
*   Run `npm cache clean --force` in terminal.
*   Delete any old ZIP files.
*   Ensure `node_modules` only contains production deps (`npm prune --production`).

**"Prisma Client not initialized":**
*   You probably missed the `npx prisma generate` step. This needs to run *after* `npm install` on the server so Prisma builds the client for the server's OS (Linux).
