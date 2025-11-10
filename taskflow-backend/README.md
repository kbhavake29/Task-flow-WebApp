# TaskFlow Backend

Production-ready Express + MySQL + Redis backend for TaskFlow task management application.

## Features

- ✅ **Express.js** with TypeScript
- ✅ **MySQL 8.0+** with connection pooling
- ✅ **Redis 7.0+** for caching and session management
- ✅ **JWT Authentication** with access and refresh tokens
- ✅ **Security**: Helmet, CORS, rate limiting, input validation, bcrypt
- ✅ **Logging**: Winston with daily log rotation
- ✅ **Error Handling**: Global error handler with detailed logging
- ✅ **Caching Strategy**: Redis caching with automatic invalidation
- ✅ **Database Migrations**: Automated SQL migration system
- ✅ **Production Ready**: Health checks, graceful shutdown, Docker support

## Prerequisites

- Node.js 18+ LTS
- MySQL 8.0+
- Redis 7.0+
- npm 9+

## Quick Start

### 1. Installation

```bash
# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Generate secure credentials
./scripts/generate-credentials.sh > .env

# Or manually create .env from .env.example
cp .env.example .env
# Edit .env and add your credentials
```

### 3. Start Services (Docker)

```bash
# Start MySQL and Redis
docker-compose up -d

# Wait for services to be healthy
docker-compose ps
```

### 4. Run Database Migrations

```bash
# Run all pending migrations
npm run migrate

# (Optional) Seed development data
npm run seed
```

### 5. Start Development Server

```bash
# Start in development mode with hot reload
npm run dev

# Server will be running at http://localhost:3000
```

## Available Scripts

```bash
npm run dev              # Start development server with hot reload
npm run build            # Build TypeScript to JavaScript
npm start                # Start production server
npm run migrate          # Run database migrations
npm run seed             # Seed development data
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types
```

## Project Structure

```
taskflow-backend/
├── src/
│   ├── config/          # Configuration (database, redis, jwt, env)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models (data access layer)
│   ├── services/        # Business logic
│   ├── routes/          # API route definitions
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions and helpers
│   ├── migrations/      # SQL migration files
│   ├── scripts/         # Utility scripts (migrate, seed)
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server entry point
├── logs/                # Application logs (gitignored)
├── docker-compose.yml   # Local MySQL + Redis setup
├── Dockerfile           # Production Docker image
└── README.md
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in to existing account
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and revoke tokens
- `GET /api/auth/user` - Get current user info

### Projects

- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks

- `GET /api/tasks` - Get all tasks (with filters)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Statistics

- `GET /api/stats/dashboard` - Get dashboard statistics

### Health Check

- `GET /health` - Health check endpoint (no auth required)

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=taskflow_user
DB_PASSWORD=<your-password>
DB_NAME=taskflow_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<your-password>

# JWT Secrets (generate with crypto.randomBytes(64).toString('hex'))
JWT_ACCESS_SECRET=<64-byte-hex>
JWT_REFRESH_SECRET=<64-byte-hex>

# CORS
ALLOWED_ORIGINS=http://localhost:8080

# Frontend
FRONTEND_URL=http://localhost:8080
```

## Security Features

- **Password Hashing**: Bcrypt with cost factor 12
- **JWT Tokens**: Separate access (15min) and refresh (7 days) tokens
- **Token Storage**: Refresh tokens in HttpOnly cookies, access tokens in memory
- **Token Blacklisting**: Revoked tokens stored in Redis
- **Rate Limiting**: Global (100/15min), Auth (5/15min), API (1000/hour)
- **Input Validation**: express-validator with custom validation rules
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Prevention**: Input sanitization and escaping
- **Security Headers**: Helmet.js for secure HTTP headers
- **CORS**: Configurable origin whitelist

## Caching Strategy

- **User data**: 30 minutes
- **Projects**: 10 minutes (list), 5 minutes (individual)
- **Tasks**: 2 minutes
- **Dashboard stats**: 5 minutes
- **Automatic invalidation** on create/update/delete operations

## Database Migrations

Migrations are automatically executed in order. The system tracks which migrations have been applied.

```bash
# Run migrations
npm run migrate

# Migrations are located in src/migrations/
# Named with incrementing numbers: 001_create_users_table.sql
```

## Development Data

```bash
# Seed the database with test data
npm run seed

# Test account credentials:
# Email: test@taskflow.com
# Password: TestPass123!
```

## Production Deployment

### Docker Build

```bash
# Build Docker image
docker build -t taskflow-backend .

# Run container
docker run -p 3000:3000 --env-file .env taskflow-backend
```

### Manual Deployment

```bash
# Build TypeScript
npm run build

# Set NODE_ENV to production
export NODE_ENV=production

# Start server
npm start
```

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  },
  "version": "1.0.0",
  "uptime": 12345
}
```

### Logs

Logs are stored in the `logs/` directory:

- `error-YYYY-MM-DD.log` - Error logs only
- `combined-YYYY-MM-DD.log` - All logs
- Logs are rotated daily and retained for 14-30 days

## Troubleshooting

### Database Connection Issues

```bash
# Check if MySQL is running
docker-compose ps

# View MySQL logs
docker-compose logs mysql

# Test connection
mysql -h localhost -u taskflow_user -p
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker-compose ps

# View Redis logs
docker-compose logs redis

# Test connection
redis-cli -h localhost -p 6379 -a <REDIS_PASSWORD> ping
```

### Migration Issues

```bash
# Check which migrations have been applied
mysql -h localhost -u taskflow_user -p taskflow_db -e "SELECT * FROM migrations;"

# Manually run a specific migration
mysql -h localhost -u taskflow_user -p taskflow_db < src/migrations/001_create_users_table.sql
```

## Contributing

1. Create a new branch
2. Make your changes
3. Run linter and tests
4. Create a pull request

## License

MIT
