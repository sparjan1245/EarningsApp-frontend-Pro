# Admin Service

A NestJS microservice responsible for user role management, stock data management, and administrative functions.

## 🚀 Features

- User role management (promote, demote, set roles)
- Stock data upload and management
- CSV file processing
- Financial records management
- Audit logging
- Login activity tracking
- Admin-only endpoints with role-based access control
- Date-based filtering (today, yesterday, tomorrow, this week, next week)
- Public preview data for unauthenticated users

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

## 🛠️ Setup & Installation

### Option 1: Docker (Recommended)

1. **Install dependencies:**
   ```bash
   cd backend/adminservice
   npm install
   ```

2. **Start all services:**
   ```bash
   cd ..
   docker compose up -d
   ```

3. **Seed the database with superadmin user:**
   ```bash
   docker compose exec adminservice node prisma/seed.js
   ```

### Option 2: Local Development

1. **Install dependencies:**
   ```bash
   cd backend/adminservice
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the `adminservice` directory:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5434/authdb
   JWT_SECRET=your-jwt-secret-key
   PORT=3002
   ```

3. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

4. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

5. **Seed the database:**
   ```bash
   node prisma/seed.js
   ```

6. **Start the development server:**
   ```bash
   npm run start:dev
   ```

## 🐳 Docker Commands

### Service Management
```bash
# Build the service
docker compose build adminservice

# Start the service
docker compose up -d adminservice

# View logs
docker compose logs adminservice

# Execute commands in container
docker compose exec adminservice sh
```

### Database Operations
```bash
# Run migrations
docker compose exec adminservice npx prisma migrate deploy

# Seed database
docker compose exec adminservice node prisma/seed.js

# Open Prisma Studio
docker compose exec adminservice npx prisma studio --port 5555 --hostname 0.0.0.0
```

## 📡 API Endpoints

### User Management
- `GET /api/admin/users` - Get all users (Admin only)
- `PATCH /api/admin/promote` - Promote user to admin
- `PATCH /api/admin/demote` - Demote admin to user
- `PATCH /api/admin/set-role` - Set specific user role
- `GET /api/admin/login-activity/:email` - Get login activity logs

### Stock Management
- `POST /api/stock/upload` - Upload stock data file
- `POST /api/stock/upload-earnings` - Upload earnings data
- `POST /api/stock/add` - Add single stock record
- `POST /api/stock/bulk-upload` - Add multiple stock records
- `POST /api/stock/chunked-bulk-upsert` - Add stock records in chunks
- `GET /api/stock/all` - Get all stock data
- `GET /api/stock/search` - Search stock data
- `GET /api/stock/paginated` - Get paginated stock data
- `GET /api/stock/today` - Get today's earnings
- `GET /api/stock/yesterday` - Get yesterday's earnings
- `GET /api/stock/tomorrow` - Get tomorrow's earnings
- `GET /api/stock/this-week` - Get this week's earnings
- `GET /api/stock/next-week` - Get next week's earnings
- `GET /api/stock/public-preview` - Get public preview data
- `DELETE /api/stock/:id` - Delete stock record
- `PATCH /api/stock/:id` - Update stock record

### CSV Processing
- `POST /api/csv/upload` - Upload and process CSV files

## 🔐 Default Admin User

After seeding, you can login with:
- **Email:** `sadmin@admin.com`
- **Password:** `Superadmin123!`
- **Role:** `SUPER_ADMIN`

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check if PostgreSQL is running
   docker compose ps postgres
   
   # Check database logs
   docker compose logs postgres
   ```

2. **Seed Script Issues**
   ```bash
   # Make sure seed.js exists
   docker compose exec adminservice ls -la prisma/
   
   # Run seed manually
   docker compose exec adminservice node prisma/seed.js
   ```

3. **Permission Issues**
   ```bash
   # Check file permissions
   ls -la docker-entrypoint.sh
   
   # Fix permissions if needed
   chmod +x docker-entrypoint.sh
   ```

## 📁 Project Structure

```
adminservice/
├── src/
│   ├── admin/                 # Admin module
│   │   ├── admin.controller.ts
│   │   ├── admin.service.ts
│   │   ├── admin.module.ts
│   │   └── dto/              # Data transfer objects
│   ├── stock/                # Stock management
│   │   ├── stock.controller.ts
│   │   ├── stock.service.ts
│   │   ├── stock.module.ts
│   │   └── dto/              # Stock DTOs
│   ├── csv/                  # CSV processing
│   ├── audit/                # Audit logging
│   ├── common/               # Common utilities
│   │   ├── decorators/       # Custom decorators
│   │   ├── guards/           # Authentication guards
│   │   └── strategies/       # Passport strategies
│   ├── prisma/               # Database service
│   └── main.ts               # Application entry point
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Database migrations
│   └── seed.js               # Database seed script
├── proto/                    # gRPC protocol files
├── Dockerfile                # Docker configuration
└── package.json              # Dependencies and scripts
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run start:dev

# Production
npm run start:prod

# Build
npm run build

# Generate Prisma client
npm run generate

# Run migrations
npm run migrate

# Test
npm run test

# Lint
npm run lint

# Format
npm run format
```

### Database Management

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

## 📊 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `PORT` | Service port | `3002` |

## 🔗 Related Services

- **Gateway Service:** Routes requests to appropriate microservices
- **Auth Service:** Handles authentication and user management
- **Frontend:** React application consuming the API
