# Earnings App - Full Stack Application

A comprehensive earnings calendar application with real-time chat features, built with NestJS microservices and React.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: NestJS microservices architecture
  - Gateway Service (Port 3000) - API Gateway
  - Auth Service (Port 3001) - Authentication & User Management
  - Admin Service (Port 3002) - Admin operations & Stock Management

## 📁 Project Structure

```
EarningsApp-frontend-dev/
├── backend/
│   ├── gateway/          # API Gateway
│   ├── authservice2/     # Authentication Service
│   └── adminservice/     # Admin Service
├── frontend/
│   └── earnings-calendar/ # React Frontend
├── deployment/           # Environment configuration files
└── scripts/              # Build and deployment scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis (for admin service)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd EarningsApp-frontend-dev

# Install root dependencies
npm install

# Install backend dependencies
cd backend/gateway && npm install && cd ../..
cd backend/authservice2 && npm install && cd ../..
cd backend/adminservice && npm install && cd ../..

# Install frontend dependencies
cd frontend/earnings-calendar && npm install && cd ../..
```

### Development

```bash
# Start all services with Docker
docker-compose up

# Or start individually
# Terminal 1: Gateway
cd backend/gateway && npm run start:dev

# Terminal 2: Auth Service
cd backend/authservice2 && npm run start:dev

# Terminal 3: Admin Service
cd backend/adminservice && npm run start:dev

# Terminal 4: Frontend
cd frontend/earnings-calendar && npm run dev
```

## 🔧 Environment Setup

Copy the example environment files and configure them:

```bash
# Gateway
cp deployment/gateway.env.example backend/gateway/.env

# Auth Service
cp deployment/authservice.env.example backend/authservice2/.env

# Admin Service
cp deployment/adminservice.env.example backend/adminservice/.env
```

Update the `.env` files with your actual credentials.

## 📚 Documentation

- [Hostinger VPS Deployment Guide](./HOSTINGER_VPS_DEPLOYMENT.md) - Complete VPS deployment instructions
- [Deployment Next Steps](./DEPLOYMENT_NEXT_STEPS.md) - Post-build deployment steps
- [Backend README](./backend/README.md) - Backend services documentation

## 🛠️ Build for Production

```bash
# Build all backend services
cd backend/gateway && npm run build && cd ../..
cd backend/authservice2 && npm run build && cd ../..
cd backend/adminservice && npm run build && cd ../..

# Build frontend
cd frontend/earnings-calendar && npm run build && cd ../..
```

## 🧪 Testing

```bash
# Run tests for admin service
cd backend/adminservice
npm test
npm run test:e2e
```

## 📦 Technologies Used

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: NestJS, TypeScript, gRPC, Prisma
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT, Google OAuth
- **Email**: Resend API

## 📄 License

Private project - All rights reserved
