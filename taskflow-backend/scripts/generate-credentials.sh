#!/bin/bash
# Generate secure credentials for TaskFlow backend

echo "==================================================="
echo "   TaskFlow Backend - Secure Credentials"
echo "==================================================="
echo ""

echo "# Application"
echo "NODE_ENV=development"
echo "PORT=3000"
echo "LOG_LEVEL=debug"
echo ""

echo "# Database - MySQL"
echo "DB_HOST=localhost"
echo "DB_PORT=3306"
echo "DB_USER=taskflow_user"
echo "DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=' | tr -d '\n')"
echo "DB_NAME=taskflow_db"
echo "DB_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d '=' | tr -d '\n')"
echo ""

echo "# Redis"
echo "REDIS_HOST=localhost"
echo "REDIS_PORT=6379"
echo "REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '=' | tr -d '\n')"
echo ""

echo "# JWT Secrets"
echo "JWT_ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" | tr -d '\n')"
echo "JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" | tr -d '\n')"
echo "JWT_ACCESS_EXPIRY=15m"
echo "JWT_REFRESH_EXPIRY=7d"
echo ""

echo "# CORS"
echo "ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173"
echo ""

echo "# Frontend"
echo "FRONTEND_URL=http://localhost:8080"
echo ""

echo "# Rate Limiting"
echo "RATE_LIMIT_WINDOW_MS=900000"
echo "RATE_LIMIT_MAX_REQUESTS=100"
echo ""

echo ""
echo "==================================================="
echo "⚠️  IMPORTANT: Save these credentials securely!"
echo "==================================================="
