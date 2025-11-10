# TaskFlow - Project Management Web Application

A full-stack task and project management application built with React, TypeScript, Express.js, MySQL, and Redis.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React + TypeScript Frontend (Vite)                       │  │
│  │  - React Router for navigation                            │  │
│  │  - TanStack Query for data fetching                       │  │
│  │  - shadcn/ui components                                   │  │
│  │  - Tailwind CSS for styling                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              │ (JWT Authentication)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express.js + TypeScript Backend                         │  │
│  │  - RESTful API endpoints                                  │  │
│  │  - JWT Authentication & Authorization                    │  │
│  │  - Input validation & sanitization                       │  │
│  │  - Rate limiting & security middleware                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   DATA LAYER             │   │   CACHE LAYER           │
│   ┌────────────────────┐ │   │   ┌──────────────────┐ │
│   │  MySQL Database    │ │   │   │  Redis Cache     │ │
│   │  - Users           │ │   │   │  - Session data  │ │
│   │  - Projects        │ │   │   │  - Token cache   │ │
│   │  - Tasks           │ │   │   │  - Query cache   │ │
│   │  - Refresh Tokens  │ │   │   │  - Rate limiting │ │
│   └────────────────────┘ │   │   └──────────────────┘ │
└──────────────────────────┘   └──────────────────────────┘
```

## Features

- **User Management**: Authentication, authorization, and profile management
- **Project Management**: Create, update, archive, and delete projects
- **Task Management**: Task CRUD operations with due dates and status tracking
- **Dashboard**: Real-time statistics and visualizations
- **Admin Panel**: System-wide user, project, and task management
- **Data Export**: Export projects and tasks as JSON or CSV
- **Caching**: Redis-based caching for improved performance
- **Security**: JWT tokens, rate limiting, input validation, and SQL injection prevention

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- React Router
- TanStack Query
- shadcn/ui
- Tailwind CSS
- Recharts

### Backend
- Node.js + Express.js
- TypeScript
- MySQL 8.0
- Redis 7.0
- JWT Authentication
- Winston Logging

## Prerequisites

- Node.js 18+ LTS
- MySQL 8.0+
- Redis 7.0+
- npm 9+

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/kbhavake29/Task-flow-WebApp.git
cd Task-Flow-Application
```

### 2. Backend Setup

```bash
cd taskflow-backend

# Install dependencies
npm install

# Generate environment variables
./scripts/generate-credentials.sh > .env
# Or manually copy .env.example to .env and fill in values

# Start MySQL and Redis (using Docker)
docker-compose up -d

# Run database migrations
npm run migrate

# (Optional) Seed development data
npm run seed

# Start development server
npm run dev
```

Backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd taskflow-interview-app

# Install dependencies
npm install

# Create .env file (if needed)
# VITE_API_BASE_URL=http://localhost:3000/api

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## Environment Variables

### Backend (.env)

**⚠️ IMPORTANT: Never commit your `.env` file! Always use `.env.example` as a template.**

1. Copy the example file:
   ```bash
   cd taskflow-backend
   cp .env.example .env
   ```

2. **Generate secure passwords and secrets:**
   - **Database Password**: Generate a strong password for MySQL
   - **Redis Password**: Generate a strong password for Redis
   - **JWT Secrets**: Generate 64-byte hex strings:
     ```bash
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     ```
   - Or use the provided script:
     ```bash
     ./scripts/generate-credentials.sh > .env
     ```

3. Edit `.env` and replace all placeholder values with your actual credentials:
   - Replace `your_secure_password_here` with your MySQL password
   - Replace `your_redis_password_here` with your Redis password
   - Replace `your_64_byte_hex_secret_here` with generated JWT secrets

**Key variables:**
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - MySQL configuration
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - Redis configuration
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` - JWT secrets (64-byte hex strings)
- `ALLOWED_ORIGINS` - CORS allowed origins
- `FRONTEND_URL` - Frontend URL for redirects

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Project Structure

```
Task-Flow-Application/
├── taskflow-backend/          # Express.js backend
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── controllers/         # Route controllers
│   │   ├── middleware/       # Express middleware
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utility functions
│   │   └── migrations/       # SQL migrations
│   └── docker-compose.yml    # Docker services
│
└── taskflow-interview-app/   # React frontend
    ├── src/
    │   ├── components/       # React components
    │   ├── contexts/         # React contexts
    │   ├── hooks/            # Custom hooks
    │   ├── lib/              # Utilities & API client
    │   └── pages/            # Page components
    └── public/               # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user

### Projects
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project
- `POST /api/projects` - Create project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - List tasks
- `GET /api/tasks/:id` - Get task
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/bulk-update-status` - Bulk update tasks

### Statistics
- `GET /api/stats/dashboard` - Dashboard statistics
- `GET /api/stats/account` - Account statistics

### Admin (Admin only)
- `GET /api/admin/users` - All users
- `GET /api/admin/projects` - All projects
- `GET /api/admin/tasks` - All tasks
- `GET /api/admin/stats` - System statistics

## Development

### Backend Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run migrate      # Run database migrations
npm run seed         # Seed development data
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Frontend Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Security Features

- JWT-based authentication with access and refresh tokens
- Password hashing with bcrypt (12 rounds)
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)
- Rate limiting (global, auth, and API limits)
- CORS configuration
- Security headers (Helmet.js)
- Token blacklisting on logout

## Testing

Test accounts are created when running `npm run seed`:
- Admin: `admin@taskflow.com` / `AdminPass123!`
- User: `test@taskflow.com` / `TestPass123!`

## Production Deployment

### Backend

```bash
# Build
npm run build

# Set NODE_ENV=production
export NODE_ENV=production

# Start
npm start
```

### Docker

```bash
# Build image
docker build -t taskflow-backend .

# Run container
docker run -p 3000:3000 --env-file .env taskflow-backend
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

