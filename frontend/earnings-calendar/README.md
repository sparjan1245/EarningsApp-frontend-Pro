# Earnings Calendar Frontend

A React-based frontend application for managing and viewing earnings data with authentication, user management, and real-time data filtering.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Backend services running (see backend README)

### 1. Install Dependencies

```bash
# Navigate to frontend directory
cd frontend/earnings-calendar

# Install dependencies
npm install
```

### 2. Start Development Server

```bash
# Start the development server
npm run dev
```

The application will be available at:
- **Local:** http://localhost:5173
- **Network:** http://localhost:5174 (if 5173 is in use)

### 3. Build for Production

```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

## 🏗️ Architecture

The frontend is built with:
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Redux Toolkit Query** - API state management
- **Material-UI** - Component library
- **React Router** - Client-side routing
- **React Hook Form** - Form handling

## 🔗 API Endpoints

The frontend communicates with the backend through the following services:

- **Gateway API:** http://localhost:3000/api/

### Key Features

- **Authentication:** Login, signup, OAuth, password reset
- **User Management:** Role-based access control
- **Earnings Data:** View, filter, and manage stock earnings
- **Date Filtering:** Today, yesterday, tomorrow, this week, next week
- **Public Preview:** Limited data for unauthenticated users
- **Admin Panel:** User management and data administration

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Environment Configuration

The frontend uses Vite's proxy configuration to forward API requests to the backend gateway. This is configured in `vite.config.ts`.

### Key Components

- **Dashboard:** Main earnings calendar view
- **Authentication:** Login, signup, and OAuth flows
- **Admin Panel:** User and data management
- **Date Filtering:** Time-based data filtering
- **Earnings Table:** Data display and interaction

## 🚨 Troubleshooting

### Common Issues

1. **Backend Not Running**
   ```bash
   # Make sure backend services are running
   cd ../../backend
   docker compose ps
   
   # Start backend if needed
   docker compose up -d
   
   # Check if gateway is responding
   curl http://localhost:3000/api/stock/test
   ```

2. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :5173
   
   # Kill the process
   kill -9 <PID>
   ```

3. **API Connection Issues**
   ```bash
   # Check if gateway is running
   curl http://localhost:3000/api/stock/test
   
   # Check proxy configuration in vite.config.ts
   # Make sure it points to http://localhost:3000
   ```

4. **Authentication Issues**
   ```bash
   # Make sure superadmin is seeded
   cd ../../backend
   docker compose exec auth-service node prisma/seed.js
   docker compose exec adminservice node prisma/seed.js
   
   # Test login with default admin
   curl -X POST -H "Content-Type: application/json" \
     -d '{"email":"sadmin@admin.com","password":"Superadmin123!"}' \
     http://localhost:3000/api/auth/login
   ```

5. **Gateway Port Issues**
   ```bash
   # Check if gateway is listening on correct port
   docker exec backend-gateway-1 netstat -tlnp
   
   # Rebuild gateway if needed
   cd ../../backend
   docker compose build gateway
   docker compose up -d gateway
   ```

### Development Tips

- Use browser dev tools to inspect network requests
- Check the Redux DevTools for state management
- Monitor the terminal for Vite compilation errors
- Use the browser console for debugging
- Check the Network tab for API request/response details

## 📁 Project Structure

```
frontend/earnings-calendar/
├── src/
│   ├── app/                    # Redux store and auth slice
│   ├── components/             # Reusable UI components
│   ├── features/               # Feature-based components
│   │   ├── admin/             # Admin panel components
│   │   └── dashboard/         # Dashboard components
│   ├── pages/                 # Page components
│   ├── router/                # Routing configuration
│   ├── services/              # API service functions
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
├── public/                    # Static assets
├── vite.config.ts            # Vite configuration
└── package.json              # Dependencies and scripts
```

## 🔐 Authentication Flow

1. **Login:** User enters credentials → JWT tokens stored in cookies
2. **Refresh:** Automatic token refresh on app startup
3. **OAuth:** Google OAuth integration with redirect handling
4. **Logout:** Clear tokens and redirect to login

## 📊 Data Management

- **Earnings Data:** Stock earnings information with filtering
- **User Management:** Admin can manage users and roles
- **Real-time Updates:** Data updates reflect immediately
- **Pagination:** Large datasets are paginated for performance

## 🎨 UI/UX Features

- **Responsive Design:** Works on desktop and mobile
- **Dark/Light Theme:** Material-UI theme support
- **Loading States:** Proper loading indicators
- **Error Handling:** User-friendly error messages
- **Accessibility:** WCAG compliant components

## 🐳 Backend Setup

Before running the frontend, ensure the backend services are properly configured:

```bash
# Navigate to backend directory
cd ../../backend

# Start all services
docker compose up -d

# Seed the databases
docker compose exec auth-service node prisma/seed.js
docker compose exec adminservice node prisma/seed.js

# Verify services are running
docker compose ps

# Test gateway
curl http://localhost:3000/api/stock/test
```

### Default Admin Credentials
- **Email:** `sadmin@admin.com`
- **Password:** `Superadmin123!`
- **Role:** `SUPERADMIN`
