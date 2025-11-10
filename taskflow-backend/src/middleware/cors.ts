import cors from 'cors';
import { env } from '../config/environment';

/**
 * CORS configuration middleware
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = env.allowedOrigins;

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours preflight cache
});
