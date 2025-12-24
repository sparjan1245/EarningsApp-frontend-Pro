<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).


docker-compose build auth-service
docker-compose up -d auth-service

docker-compose up -d postgres redis auth-service

# Auth Service

A NestJS microservice responsible for user authentication, authorization, and OAuth integration.

## 🚀 Features

- User registration and login
- JWT-based authentication
- Google OAuth integration
- Password reset functionality
- Email verification
- Role-based access control
- Refresh token management
- Redis session storage

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

## 🛠️ Setup & Installation

### Option 1: Docker (Recommended)

1. **Install dependencies:**
   ```bash
   cd backend/authservice2
   npm install
   ```

2. **Start all services:**
   ```bash
   cd ..
   docker compose up -d
   ```

3. **Seed the database with superadmin user:**
   ```bash
   docker compose exec auth-service node prisma/seed.js
   ```

### Option 2: Local Development

1. **Install dependencies:**
   ```bash
   cd backend/authservice2
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the `authservice2` directory:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5434/authdb_auth
   REDIS_HOST=localhost
   REDIS_PORT=6379
   JWT_SECRET=your-jwt-secret-key
   JWT_EXPIRATION=15m
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/oauth/google/callback
   SENDGRID_API_KEY=your-sendgrid-api-key
   PORT=3001
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
docker compose build auth-service

# Start the service
docker compose up -d auth-service

# View logs
docker compose logs auth-service

# Execute commands in container
docker compose exec auth-service sh
```

### Database Operations
```bash
# Run migrations
docker compose exec auth-service npx prisma migrate deploy

# Seed database
docker compose exec auth-service node prisma/seed.js

# Open Prisma Studio
docker compose exec auth-service npx prisma studio --port 5555 --hostname 0.0.0.0
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/verify` - Verify email
- `POST /api/auth/forgot` - Request password reset
- `POST /api/auth/reset` - Reset password
- `GET /api/auth/oauth/google` - Google OAuth
- `GET /api/auth/oauth/google/callback` - OAuth callback

### User Management
- `GET /api/users/me` - Get current user

## 🔐 Default Admin User

After seeding, you can login with:
- **Email:** `sadmin@admin.com`
- **Password:** `Superadmin123!`
- **Role:** `SUPERADMIN`

## 🚨 Troubleshooting

### Common Issues

1. **JWT Secret Missing**
   ```bash
   # Add JWT_SECRET to .env file
   echo "JWT_SECRET=your-super-secret-jwt-key" >> .env
   
   # Rebuild and restart
   docker compose build auth-service
   docker compose up -d auth-service
   ```

2. **Database Connection Issues**
   ```bash
   # Check if PostgreSQL is running
   docker compose ps postgres
   
   # Check database logs
   docker compose logs postgres
   ```

3. **Redis Connection Issues**
   ```bash
   # Check if Redis is running
   docker compose ps redis
   
   # Check Redis logs
   docker compose logs redis
   ```

4. **Seed Script Issues**
   ```bash
   # Make sure seed.js exists
   docker compose exec auth-service ls -la prisma/
   
   # Run seed manually
   docker compose exec auth-service node prisma/seed.js
   ```

## 📁 Project Structure

```
authservice2/
├── src/
│   ├── auth/                 # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dtos/            # Data transfer objects
│   │   ├── guards/          # Authentication guards
│   │   └── strategies/      # Passport strategies
│   ├── users/               # User management
│   ├── email/               # Email service
│   ├── redis/               # Redis configuration
│   ├── prisma/              # Database service
│   └── main.ts              # Application entry point
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Database migrations
│   └── seed.js              # Database seed script
├── Dockerfile               # Docker configuration
└── package.json             # Dependencies and scripts
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
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRATION` | JWT token expiration | `15m` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | - |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | - |
| `SENDGRID_API_KEY` | SendGrid API key for emails | - |
| `PORT` | Service port | `3001` |